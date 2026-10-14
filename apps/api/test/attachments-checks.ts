import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import multipart from '@fastify/multipart';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { adjuntoSchema, adjuntosSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { createAttachmentsService, registerAttachmentsRoutes } from '../src/modules/tickets/attachments/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
type Login = Awaited<ReturnType<typeof authenticated>>;
function form(files: { buffer: Buffer; name?: string; type?: string }[], extra = '') {
  const boundary = `attachment-${randomUUID()}`;
  const chunks = files.flatMap((file) => [Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="archivo"; filename="${file.name ?? 'captura.png'}"\r\nContent-Type: ${file.type ?? 'image/png'}\r\n\r\n`), file.buffer, Buffer.from('\r\n')]);
  if (extra) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="idComentario"\r\n\r\n${extra}\r\n`));
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(chunks), type: `multipart/form-data; boundary=${boundary}` };
}
export function attachmentsChecks(database: Database, env: Env) {
  describe('Adjuntos locales: validación y autorización', () => {
    let app: FastifyInstance; let directory: string; let originalLimit: string;
    beforeEach(async () => {
      directory = await mkdtemp(join(tmpdir(), 'helpdesk-attachments-'));
      originalLimit = (await database.selectFrom('parametros').select('valor').where('clave', '=', 'adjunto.maximo_bytes').executeTakeFirstOrThrow()).valor;
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      await database.deleteFrom('intentosLogin').execute();
      app = await buildApp({ ...env, STORAGE_DIR: directory }, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database));
      await app.register(multipart);
      registerAttachmentsRoutes(app, createAttachmentsService(database, directory));
    });
    afterEach(async () => {
      await app.close();
      await database.updateTable('parametros').set({ valor: originalLimit }).where('clave', '=', 'adjunto.maximo_bytes').execute();
      const target = resolve(directory);
      if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('helpdesk-attachments-')) throw new Error('Directorio temporal fuera de alcance.');
      await rm(target, { recursive: true, force: true });
    });
    const upload = (numero: string, login: Login, files: { buffer: Buffer; name?: string; type?: string }[] = [{ buffer: png }], extra = '', csrf = true) => {
      const body = form(files, extra);
      return app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/adjuntos`, payload: body.payload,
        headers: { cookie: login.cookie, 'content-type': body.type, ...(csrf ? { 'x-csrf-token': login.session.csrfToken } : {}) } });
    };
    const create = async (username = 'ana.managua', idSolicitante = 2) => {
      const login = await authenticated(app, username);
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: {
        titulo: `Prueba de adjunto ${randomUUID()}`, descripcion: 'Evidencia del caso local', tipo: 'INCIDENTE', idCategoria: 4,
        impacto: 'MEDIO', urgencia: 'MEDIA', idActivo: null, idSolicitante, canalIngreso: 'PORTAL',
      } });
      expect(response.statusCode).toBe(201); return { numero: response.json<{ numero: string }>().numero, login };
    };
    it('guarda tipo real, UUID, hash y bitácora; descarga binaria sin rutas físicas', async () => {
      const { numero, login } = await create();
      const response = await upload(numero, login, [{ buffer: png, name: '../captura.exe', type: 'text/plain' }]);
      expect(response.statusCode).toBe(201);
      const dto = adjuntoSchema.parse(response.json()); expect(dto.nombreOriginal).toBe('captura.exe'); expect(dto.mimeType).toBe('image/png');
      const row = await database.selectFrom('ticketAdjuntos').selectAll().where('idAdjunto', '=', dto.idAdjunto).executeTakeFirstOrThrow();
      expect(row.hashSha256).toBe(createHash('sha256').update(png).digest('hex'));
      expect(await readdir(directory)).toEqual([row.nombreAlmacenado]);
      expect((await database.selectFrom('tickets').select('version').where('numero', '=', numero).executeTakeFirstOrThrow()).version).toBe(2);
      expect(await database.selectFrom('bitacora').select('accion').where('idTicket', '=', row.idTicket).where('accion', '=', 'ADJUNTO').execute()).toHaveLength(1);
      const listing = await app.inject({ url: `/api/v1/tickets/${numero}/adjuntos`, headers: { cookie: login.cookie } });
      expect(adjuntosSchema.parse(listing.json()).data).toHaveLength(1); expect(listing.body).not.toContain(row.nombreAlmacenado);
      const download = await app.inject({ url: `/api/v1/tickets/${numero}/adjuntos/${dto.idAdjunto}`, headers: { cookie: login.cookie } });
      expect(download.statusCode).toBe(200); expect(download.rawPayload).toEqual(png);
      expect(download.headers['content-disposition']).toContain('attachment;'); expect(download.headers['cache-control']).toBe('no-store');
    });
    it('rechaza falsificación MIME, vacío, varios archivos, campos extra y exceso de tamaño sin persistencia', async () => {
      const { numero, login } = await create();
      expect((await upload(numero, login, [{ buffer: Buffer.from('ejecutable falso') }])).statusCode).toBe(400);
      expect((await upload(numero, login, [{ buffer: Buffer.alloc(0) }])).statusCode).toBe(400);
      expect((await upload(numero, login, [{ buffer: png }, { buffer: png }])).statusCode).toBe(400);
      expect((await upload(numero, login, [{ buffer: png }], '1')).statusCode).toBe(400);
      await database.updateTable('parametros').set({ valor: '16' }).where('clave', '=', 'adjunto.maximo_bytes').execute();
      expect((await upload(numero, login)).statusCode).toBe(413);
      expect(await readdir(directory)).toHaveLength(0);
      const ticket = await database.selectFrom('tickets').select(['idTicket', 'version']).where('numero', '=', numero).executeTakeFirstOrThrow();
      expect(ticket.version).toBe(1); expect(await database.selectFrom('ticketAdjuntos').selectAll().where('idTicket', '=', ticket.idTicket).execute()).toHaveLength(0);
    });
    it('deniega escritura al auditor, otra sede, falta de sesión y falta de CSRF', async () => {
      const { numero, login } = await create(); const auditor = await authenticated(app, 'auditor.demo'); const other = await authenticated(app, 'analista.rivas');
      expect((await upload(numero, auditor)).statusCode).toBe(403); expect((await upload(numero, other)).statusCode).toBe(404);
      expect((await upload(numero, login, [{ buffer: png }], '', false)).statusCode).toBe(403);
      expect((await app.inject(`/api/v1/tickets/${numero}/adjuntos`)).statusCode).toBe(401);
      const stored = adjuntoSchema.parse((await upload(numero, login)).json());
      expect((await app.inject({ url: `/api/v1/tickets/${numero}/adjuntos/${stored.idAdjunto}`, headers: { cookie: other.cookie } })).statusCode).toBe(404);
      expect((await app.inject({ url: `/api/v1/tickets/${numero}/adjuntos/${stored.idAdjunto}`, headers: { cookie: auditor.cookie } })).statusCode).toBe(403);
    });
    it('oculta adjuntos ligados a notas internas al solicitante aunque sea analista', async () => {
      const { numero, login } = await create('analista.managua', 5); const chief = await authenticated(app);
      const stored = adjuntoSchema.parse((await upload(numero, chief)).json());
      const ticket = await database.selectFrom('tickets').select('idTicket').where('numero', '=', numero).executeTakeFirstOrThrow();
      const comment = await database.insertInto('ticketComentarios').values({ idTicket: ticket.idTicket, idAutor: 1, contenido: 'Contenido reservado',
        visibilidad: 'INTERNO', origen: 'PORTAL', fechaCreacion: new Date() }).returning('idComentario').executeTakeFirstOrThrow();
      await database.updateTable('ticketAdjuntos').set({ idComentario: comment.idComentario }).where('idAdjunto', '=', stored.idAdjunto).execute();
      const url = `/api/v1/tickets/${numero}/adjuntos`;
      expect(adjuntosSchema.parse((await app.inject({ url, headers: { cookie: login.cookie } })).json()).data).toHaveLength(0);
      expect((await app.inject({ url: `${url}/${stored.idAdjunto}`, headers: { cookie: login.cookie } })).statusCode).toBe(404);
      expect((await app.inject({ url: `${url}/${stored.idAdjunto}`, headers: { cookie: chief.cookie } })).statusCode).toBe(200);
    });
    it('deniega subidas a cerrado/cancelado y un identificador de otro ticket', async () => {
      const { numero, login } = await create(); const chief = await authenticated(app);
      const stored = adjuntoSchema.parse((await upload(numero, login)).json());
      expect((await upload('TK-000007', chief)).statusCode).toBe(409);
      expect((await app.inject({ url: `/api/v1/tickets/TK-000007/adjuntos/${stored.idAdjunto}`, headers: { cookie: chief.cookie } })).statusCode).toBe(404);
      const state = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'CANCELADO').executeTakeFirstOrThrow();
      await database.updateTable('tickets').set({ idEstado: state.idEstado }).where('numero', '=', numero).execute();
      expect((await upload(numero, login)).statusCode).toBe(409);
    });
    it('serializa subidas concurrentes y conserva incrementos de versión', async () => {
      const { numero, login } = await create();
      expect((await Promise.all([upload(numero, login), upload(numero, login)])).map((response) => response.statusCode)).toEqual([201, 201]);
      expect((await database.selectFrom('tickets').select('version').where('numero', '=', numero).executeTakeFirstOrThrow()).version).toBe(3);
      expect(await readdir(directory)).toHaveLength(2);
    });
  });
}
