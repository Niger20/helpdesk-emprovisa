import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Database } from '../src/infra/db/client.js';
import { createDatabase } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createAuditService, createReportAuditRecorder } from '../src/modules/audit/index.js';
import { createReportsService } from '../src/modules/reports/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';
import { tokenHash } from '../src/common/crypto/session-tokens.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';

export function auditApiChecks(database: Database, env: Env) {
  describe('Auditoría: consulta acotada, privacidad y verificación readonly', () => {
    let app: FastifyInstance; let readonly: Database;
    const range = 'desde=2020-01-01&hasta=2030-12-31';
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', bloqueadoHasta: null, intentosFallidos: 0 }).execute();
      readonly = createDatabase(env.DATABASE_READONLY_URL, 3);
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database), undefined, undefined, undefined,
        { audit: createAuditService(readonly), reports: createReportsService(readonly, createReportAuditRecorder(database)) });
    });
    afterEach(async () => { await app.close(); await readonly.destroy(); });
    it('deniega anónimo y solicitante en lista e integridad, también en service', async () => {
      const login = await authenticated(app, 'ana.managua');
      for (const url of [`/api/v1/auditoria?${range}`, '/api/v1/auditoria/integridad']) {
        expect((await app.inject(url)).statusCode).toBe(401);
        expect((await app.inject({ url, headers: { cookie: login.cookie } })).statusCode).toBe(403);
      }
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      await expect(createAuditService(readonly).integrity(context)).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('consulta y verifica sin escribir, con hashes y sin valores sensibles', async () => {
      const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
      const before = await database.selectFrom('auditoriaSistema').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      const ticket = await app.inject({ url: `/api/v1/auditoria?${range}&numero=TK-000001&pageSize=2`, headers });
      expect(ticket.statusCode).toBe(200); expect(ticket.json().data).toHaveLength(2);
      expect(ticket.json().data.every((row: { numero: string }) => row.numero === 'TK-000001')).toBe(true);
      expect(ticket.body).not.toMatch(/valorNuevo|valorAnterior|idSesion|token|password|contenido|detalle/);
      const system = await app.inject({ url: `/api/v1/auditoria?${range}&clase=SISTEMA`, headers });
      expect(system.statusCode).toBe(200); expect(system.body).not.toMatch(/detalle|idEntidad|idSesion|passwordHash|tokenHash/);
      const verification = await app.inject({ url: '/api/v1/auditoria/integridad', headers });
      expect(verification.statusCode).toBe(200); expect(verification.json().bitacora.valida).toBe(true); expect(verification.json().sistema.valida).toBe(true);
      expect(verification.json().bitacora.registros).toBeGreaterThan(0); expect(verification.headers['cache-control']).toBe('no-store');
      expect(await database.selectFrom('auditoriaSistema').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow()).toEqual(before);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auditoria', headers })).statusCode).toBe(404);
    });
    it('limita tickets por alcance de sede y deniega evidencia global con permiso local', async () => {
      const original = await database.selectFrom('usuarioRol').selectAll().where('idUsuario', '=', 7).executeTakeFirstOrThrow();
      await database.updateTable('usuarioRol').set({ idSedeAlcance: 1 }).where('idUsuarioRol', '=', original.idUsuarioRol).execute();
      try {
        const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
        const ticket = await app.inject({ url: `/api/v1/auditoria?${range}&numero=TK-000001`, headers });
        expect(ticket.statusCode).toBe(200); expect(ticket.json().meta.total).toBe(0);
        expect((await app.inject({ url: `/api/v1/auditoria?${range}&clase=SISTEMA`, headers })).statusCode).toBe(403);
        expect((await app.inject({ url: '/api/v1/auditoria/integridad', headers })).statusCode).toBe(403);
      } finally { await database.updateTable('usuarioRol').set({ idSedeAlcance: original.idSedeAlcance }).where('idUsuarioRol', '=', original.idUsuarioRol).execute(); }
    });
    it('valida fechas, filtros incompatibles y devuelve vacío con paginación', async () => {
      const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
      expect((await app.inject({ url: '/api/v1/auditoria?desde=2026-02-30&hasta=2026-03-01', headers })).statusCode).toBe(400);
      expect((await app.inject({ url: `/api/v1/auditoria?${range}&clase=SISTEMA&numero=TK-000001`, headers })).statusCode).toBe(400);
      const response = await app.inject({ url: `/api/v1/auditoria?${range}&accion=NO_EXISTE`, headers });
      expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ data: [], meta: { total: 0, page: 1, pageSize: 20 } });
    });
    it('oculta notas propias incluso a un auditor y no devuelve los detalles almacenados', async () => {
      const original = await database.selectFrom('tickets').selectAll().where('idTicket', '=', 1).executeTakeFirstOrThrow();
      const ticket = await database.insertInto('tickets').values({ ...original, idTicket: undefined, numero: 'TK-899999', idSolicitante: 7 })
        .returning('idTicket').executeTakeFirstOrThrow();
      for (const accion of ['CREACION', 'COMENTARIO_INTERNO']) await database.insertInto('bitacora').values({ idTicket: ticket.idTicket, idUsuario: 5,
        accion, automatica: false, fechaHora: new Date(), valorNuevo: { contenido: 'Marca privada de prueba que no debe salir' }, hashPrevio: '', hashRegistro: '' }).execute();
      const login = await authenticated(app, 'auditor.demo');
      const response = await app.inject({ url: `/api/v1/auditoria?${range}&numero=TK-899999`, headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200); expect(response.json().data.map((row: { accion: string }) => row.accion)).toEqual(['CREACION']);
      expect(response.body).not.toContain('Marca privada de prueba');
    });
    it('registra reportes y exports sin contenido sensible, conserva hash y dirección de origen', async () => {
      const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
      expect((await app.inject({ url: `/api/v1/reportes?${range}`, headers })).statusCode).toBe(200);
      expect((await app.inject({ url: `/api/v1/reportes/exportar/xlsx?${range}`, headers })).statusCode).toBe(200);
      const session = await database.selectFrom('sesiones').select('idSesion').where('tokenHash', '=', tokenHash(login.rawToken)).executeTakeFirstOrThrow();
      const events = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'reportes').where('idSesion', '=', session.idSesion).execute();
      expect(events.map((event) => event.accion).sort()).toEqual(['REPORTE_CONSULTADO', 'REPORTE_EXPORTADO']);
      expect(events.every((event) => event.direccionIp === '127.0.0.1')).toBe(true);
      expect(events[0]?.hashRegistro).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(events.map((event) => event.detalle))).not.toMatch(/cookie|correo|password|token|comentario/);
    });
    it('registra origen HTTP de un alta sin aceptar una IP inventada por header', async () => {
      const login = await authenticated(app, 'ana.managua');
      const created = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken,
        'x-forwarded-for': '192.0.2.200' }, payload: { titulo: 'Origen de auditoría HTTP', descripcion: 'Caso ficticio', tipo: 'INCIDENTE', idCategoria: 4,
        idActivo: null, impacto: 'MEDIO', urgencia: 'MEDIA', idSolicitante: 2, canalIngreso: 'PORTAL' } });
      expect(created.statusCode).toBe(201);
      const ticket = await database.selectFrom('tickets').select('idTicket').where('numero', '=', created.json().numero).executeTakeFirstOrThrow();
      const record = await database.selectFrom('bitacora').select('direccionIp').where('idTicket', '=', ticket.idTicket).where('accion', '=', 'CREACION').executeTakeFirstOrThrow();
      expect(record.direccionIp).toBe('127.0.0.1');
    });
  });
}
