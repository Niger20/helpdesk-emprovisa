import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import type { SimulatedMail } from '@helpdesk/contracts';
import { buildNotificationsService } from '../src/modules/notifications/index.js';
import { buildMailIngestService } from '../src/modules/mail-ingest/index.js';
import { buildJobsService } from '../src/modules/jobs/index.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

export function notificationsMailChecks(database: Database, env: Env) {
  describe('Notificaciones y recepción de correo simuladas', () => {
    let app: FastifyInstance;
    const now = new Date('2026-10-16T16:00:00Z');
    const mail = buildMailIngestService(database);
    const jobs = buildJobsService(database, (trx, time) => buildNotificationsService(trx).dispatch(time), (trx, time) => buildMailIngestService(trx).ingest(time));
    let sequence = 0;
    const payload = (): SimulatedMail => ({ messageId: `demo-${++sequence}@example.invalid`, inReplyTo: null, usernameRemitente: 'ana.managua', contenido: 'Correo ficticio de prueba',
      solicitud: { tipo: 'INCIDENTE', idCategoria: 4, idActivo: null, impacto: 'ALTO', urgencia: 'ALTA', titulo: 'Caso por correo simulado', descripcion: 'Correo ficticio de prueba' } });
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', bloqueadoHasta: null, intentosFallidos: 0 }).execute();
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('tareasProgramadas').set({ activa: true }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), undefined, undefined, undefined, undefined,
        { jobs, notifications: buildNotificationsService(database), mail });
    });
    afterEach(async () => { await app.close(); });
    const enqueue = async (input: SimulatedMail) => {
      const chief = await authenticated(app);
      return app.inject({ method: 'POST', url: '/api/v1/correo-simulado', payload: input, headers: { cookie: chief.cookie, 'x-csrf-token': chief.session.csrfToken } });
    };
    const message = (messageId: string) => database.selectFrom('correosEntrantes').selectAll().where('messageId', '=', messageId).executeTakeFirstOrThrow();
    const pendingNotification = () => database.insertInto('notificaciones').values({ idDestinatario: 2, idTicket: 1, idPlantilla: 20,
      correoDestino: 'ana.managua@example.invalid', asunto: 'Aviso simulado de prueba', estado: 'PENDIENTE', intentos: 0,
      encoladaEn: now, proximoIntento: now }).returning('idNotificacion').executeTakeFirstOrThrow();
    const notification = (id: string) => database.selectFrom('notificaciones').selectAll().where('idNotificacion', '=', id).executeTakeFirstOrThrow();
    it('deriva avisos de bitácora, no duplica al repetir y conserva solo asuntos genéricos', async () => {
      await database.insertInto('bitacora').values({ idTicket: 1, idUsuario: null, accion: 'ASIGNACION', automatica: false,
        valorNuevo: { idAsignado: 5, motivo: 'Contenido privado que nunca debe aparecer en el aviso' }, fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute();
      const event = await database.selectFrom('bitacora').select('idBitacora').where('idTicket', '=', 1).where('accion', '=', 'ASIGNACION').orderBy('idBitacora', 'desc').executeTakeFirstOrThrow();
      for (let index = 0; index < 8; index++) await jobs.run('notification-dispatch', now);
      const first = await database.selectFrom('notificaciones').selectAll().where('idBitacora', '=', event.idBitacora).execute();
      await jobs.run('notification-dispatch', now);
      expect(await database.selectFrom('notificaciones').selectAll().where('idBitacora', '=', event.idBitacora).execute()).toHaveLength(first.length);
      expect(first.map((row) => row.idDestinatario).sort()).toEqual([3, 5]);
      expect(first.every((row) => row.estado === 'ENVIADA')).toBe(true);
      expect(JSON.stringify(first)).not.toContain('Contenido privado');
    });
    it('usa backoff, limita a cinco intentos y puede recuperarse antes del límite', async () => {
      const { idNotificacion } = await pendingNotification();
      const fail = (time: Date) => database.transaction().execute((trx) => buildNotificationsService(trx, async () => { throw new Error('Simulado'); }).dispatch(time));
      await fail(now);
      expect(await notification(idNotificacion)).toMatchObject({ intentos: 1, estado: 'PENDIENTE', ultimoError: 'Fallo del transporte simulado' });
      await fail(new Date(now.getTime() + 59_999)); expect((await notification(idNotificacion)).intentos).toBe(1);
      for (let index = 0; index < 4; index++) await fail((await notification(idNotificacion)).proximoIntento);
      expect(await notification(idNotificacion)).toMatchObject({ estado: 'ERROR', intentos: 5, enviadaEn: null });
      const recovered = await pendingNotification();
      await fail(now);
      await database.transaction().execute((trx) => buildNotificationsService(trx).dispatch(new Date(now.getTime() + 60_000)));
      expect(await notification(recovered.idNotificacion)).toMatchObject({ estado: 'ENVIADA', intentos: 2, ultimoError: null });
    });
    it('cada cuenta ve solo sus avisos y no recibe correo destino ni contenido interno', async () => {
      await pendingNotification();
      const owner = await authenticated(app, 'ana.managua');
      const response = await app.inject({ url: '/api/v1/notificaciones?pageSize=50', headers: { cookie: owner.cookie } });
      expect(response.statusCode).toBe(200);
      const ids = response.json().data.map((row: { idNotificacion: string }) => row.idNotificacion);
      const rows = await database.selectFrom('notificaciones').selectAll().where('idNotificacion', 'in', ids).execute();
      expect(rows.every((row) => row.idDestinatario === 2)).toBe(true); expect(response.body).not.toMatch(/correoDestino|idDestinatario|ultimoError|tokenHash/);
      expect((await app.inject('/api/v1/notificaciones')).statusCode).toBe(401);
    });
    it('solo jefatura inyecta correo ficticio y requiere CSRF', async () => {
      const input = payload(); const requester = await authenticated(app, 'ana.managua'); const chief = await authenticated(app);
      expect((await app.inject({ method: 'POST', url: '/api/v1/correo-simulado', payload: input, headers: { cookie: requester.cookie, 'x-csrf-token': requester.session.csrfToken } })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/api/v1/correo-simulado', payload: input, headers: { cookie: chief.cookie } })).statusCode).toBe(403);
      expect((await enqueue({ ...input, usernameRemitente: 'desconocido' })).statusCode).toBe(400);
    });
    it('crea ticket y enlaza respuestas por in_reply_to, sin duplicar mensajes', async () => {
      const input = payload(); expect((await enqueue(input)).statusCode).toBe(202); expect((await enqueue(input)).statusCode).toBe(202);
      await jobs.run('mail-ingest', now); const first = await message(input.messageId);
      expect(first.estado).toBe('PROCESADO'); expect(first.idTicket).not.toBeNull();
      const ticket = await database.selectFrom('tickets').selectAll().where('idTicket', '=', first.idTicket ?? 0).executeTakeFirstOrThrow();
      expect(ticket).toMatchObject({ canalIngreso: 'CORREO', idSolicitante: 2, idSede: 1, idPrioridad: 1, idRegistradoPor: 2 });
      const reply = { ...payload(), inReplyTo: input.messageId, solicitud: null, contenido: 'Respuesta en el hilo' };
      expect((await enqueue(reply)).statusCode).toBe(202); await jobs.run('mail-ingest', now); await jobs.run('mail-ingest', now);
      expect((await message(reply.messageId)).idTicket).toBe(ticket.idTicket);
      const comments = await database.selectFrom('ticketComentarios').selectAll().where('idCorreo', '=', (await message(reply.messageId)).idCorreo).execute();
      expect(comments).toHaveLength(1); expect(comments[0]).toMatchObject({ visibilidad: 'PUBLICO', origen: 'CORREO', contenido: reply.contenido });
      expect((await enqueue({ ...input, contenido: 'Otro contenido' })).statusCode).toBe(409);
    });
    it('rechaza hilo ajeno, desconocido y activo de otra sede sin crear tickets parciales', async () => {
      const original = payload(); await enqueue(original); await jobs.run('mail-ingest', now);
      const another = { ...payload(), inReplyTo: original.messageId, solicitud: null, usernameRemitente: 'carlos.rivas' };
      const unknown = { ...payload(), inReplyTo: 'hilo-desconocido', solicitud: null };
      const invalid = payload(); if (!invalid.solicitud) throw new Error('Falta payload'); invalid.solicitud.idActivo = 3;
      for (const input of [another, unknown, invalid]) await enqueue(input);
      await jobs.run('mail-ingest', now);
      for (const input of [another, unknown, invalid]) expect(await message(input.messageId)).toMatchObject({ estado: 'RECHAZADO', idTicket: null });
    });
  });
}
