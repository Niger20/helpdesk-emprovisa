import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildJobsService } from '../src/modules/jobs/index.js';
import { buildNotificationsService } from '../src/modules/notifications/index.js';
import { buildMailIngestService } from '../src/modules/mail-ingest/index.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createDemoSurveyDelivery } from '../src/infra/mail/survey-delivery.js';
import { startQueue } from '../src/infra/queue/boss.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { createSurveysService } from '../src/modules/surveys/index.js';

export function jobsChecks(database: Database, env: Env) {
  describe('Automatizaciones locales: plazos, cierre y cola persistente', () => {
    const now = new Date('2026-10-16T16:00:00Z');
    let sequence = 830000;
    let app: FastifyInstance;
    const delivery = createDemoSurveyDelivery();
    const jobs = buildJobsService(database, (trx, time) => buildNotificationsService(trx).dispatch(time), (trx, time) => buildMailIngestService(trx).ingest(time), delivery);
    const fixture = async (estado = 'NUEVO', owner = 2) => {
      const original = await database.selectFrom('tickets').selectAll().where('idTicket', '=', 1).executeTakeFirstOrThrow();
      const state = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', estado).executeTakeFirstOrThrow();
      return database.insertInto('tickets').values({ ...original, idTicket: undefined, numero: `TK-${++sequence}`, idEstado: state.idEstado, idSolicitante: owner,
        idAsignado: estado === 'NUEVO' ? null : 5, idGrupo: 1, numeroReaperturas: 0, version: 1,
        fechaCreacion: new Date(now.getTime() - 3_600_000), fechaLimiteRespuesta: new Date(now.getTime() - 1),
        fechaLimiteSolucion: new Date(now.getTime() + 3_600_000), fechaPrimeraRespuesta: null,
        fechaResolucion: null, fechaCierre: null }).returningAll().executeTakeFirstOrThrow();
    };
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', bloqueadoHasta: null, intentosFallidos: 0 }).execute();
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('tareasProgramadas').set({ activa: true }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database, delivery), undefined, undefined, undefined,
        { jobs, notifications: buildNotificationsService(database), surveys: createSurveysService(database, env.CSRF_SECRET), invitations: delivery.list });
    });
    afterEach(async () => { await app.close(); });
    const current = (id: number) => database.selectFrom('tickets').selectAll().where('idTicket', '=', id).executeTakeFirstOrThrow();
    it('dispara alerta una sola vez aun con dos ejecuciones concurrentes; ignora pausados', async () => {
      const active = await fixture(); const paused = await fixture('EN_ESPERA');
      for (const ticket of [active, paused]) await database.insertInto('slaAlertas').values({ idTicket: ticket.idTicket, cicloSla: 1,
        tipo: 'UMBRAL_50', estado: 'PENDIENTE', programadaPara: new Date(now.getTime() - 1) }).execute();
      await Promise.all([jobs.run('sla-threshold', now), jobs.run('sla-threshold', now)]);
      expect(await database.selectFrom('bitacora').selectAll().where('idTicket', '=', active.idTicket).where('accion', '=', 'ALERTA_SLA').execute()).toHaveLength(1);
      expect((await database.selectFrom('slaAlertas').selectAll().where('idTicket', '=', paused.idTicket).executeTakeFirstOrThrow()).estado).toBe('PENDIENTE');
    });
    it('escala desde NUEVO y REABIERTO preservando el reloj y registrando tarea y responsable N2', async () => {
      for (const estado of ['NUEVO', 'REABIERTO']) {
        const ticket = await fixture(estado);
        await jobs.run('sla-breach-escalation', now); await jobs.run('sla-breach-escalation', now);
        const row = await current(ticket.idTicket);
        expect(row).toMatchObject({ idGrupo: 2, idAsignado: 6, version: 2, fechaPrimeraRespuesta: null });
        expect(row.fechaLimiteRespuesta).toEqual(ticket.fechaLimiteRespuesta); expect(row.fechaLimiteSolucion).toEqual(ticket.fechaLimiteSolucion);
        const history = await database.selectFrom('bitacora').selectAll().where('idTicket', '=', row.idTicket).where('accion', '=', 'ESCALAMIENTO').execute();
        expect(history).toHaveLength(1); expect(history[0]).toMatchObject({ automatica: true, idTarea: 2, idUsuario: null, idSesion: null });
        expect(await database.selectFrom('ticketEscalamientos').selectAll().where('idTicket', '=', row.idTicket).execute()).toHaveLength(1);
      }
    });
    it('excluye tickets atendidos y pausados; sin especialista conserva estado y avisa sin duplicar', async () => {
      const attended = await fixture('EN_ATENCION'); const paused = await fixture('EN_ESPERA'); const ownSpecialist = await fixture('NUEVO', 6);
      await database.updateTable('tickets').set({ fechaPrimeraRespuesta: now }).where('idTicket', '=', attended.idTicket).execute();
      await jobs.run('sla-breach-escalation', now); await jobs.run('sla-breach-escalation', now);
      for (const ticket of [attended, paused, ownSpecialist]) expect((await current(ticket.idTicket)).version).toBe(1);
      expect(await database.selectFrom('bitacora').selectAll().where('idTicket', '=', ownSpecialist.idTicket).where('accion', '=', 'ALERTA_SLA').execute()).toHaveLength(1);
      expect((await database.selectFrom('tareasProgramadas').selectAll().where('codigo', '=', 'sla-breach-escalation').executeTakeFirstOrThrow()).ultimoResultado).toBe('PARCIAL');
    });
    it('cierra a las 48 horas exactas, emite encuesta dentro de transacción y no repite', async () => {
      const ticket = await fixture('RESUELTO');
      await database.updateTable('tickets').set({ fechaResolucion: new Date(now.getTime() - 48 * 3_600_000), fechaPrimeraRespuesta: ticket.fechaCreacion }).where('idTicket', '=', ticket.idTicket).execute();
      await jobs.run('auto-close-resolved', new Date(now.getTime() - 1)); expect((await current(ticket.idTicket)).fechaCierre).toBeNull();
      await jobs.run('auto-close-resolved', now); await jobs.run('auto-close-resolved', now);
      expect((await current(ticket.idTicket)).fechaCierre).toEqual(now);
      expect(await database.selectFrom('encuestasCsat').selectAll().where('idTicket', '=', ticket.idTicket).execute()).toHaveLength(1);
      expect(delivery.list(2, now).some((item) => item.numero === ticket.numero)).toBe(true);
      expect(delivery.list(3, now).some((item) => item.numero === ticket.numero)).toBe(false);
    });
    it('comentarios y evidencia manual posterior reinician la ventana de inactividad', async () => {
      const ticket = await fixture('RESUELTO');
      await database.updateTable('tickets').set({ fechaResolucion: new Date(now.getTime() - 49 * 3_600_000) }).where('idTicket', '=', ticket.idTicket).execute();
      await database.insertInto('ticketComentarios').values({ idTicket: ticket.idTicket, idAutor: 2, contenido: 'Revisión pendiente', visibilidad: 'PUBLICO', origen: 'PORTAL', fechaCreacion: new Date(now.getTime() - 1_000) }).execute();
      await jobs.run('auto-close-resolved', now); expect((await current(ticket.idTicket)).fechaCierre).toBeNull();
      const evidence = await fixture('RESUELTO');
      await database.updateTable('tickets').set({ fechaResolucion: new Date(now.getTime() - 49 * 3_600_000) }).where('idTicket', '=', evidence.idTicket).execute();
      await database.insertInto('bitacora').values({ idTicket: evidence.idTicket, idUsuario: 2, accion: 'ADJUNTO', automatica: false,
        fechaHora: new Date(now.getTime() - 1_000), hashPrevio: '', hashRegistro: '' }).execute();
      await jobs.run('auto-close-resolved', now); expect((await current(evidence.idTicket)).fechaCierre).toBeNull();
    });
    it('revierte cierre y bitácora si la emisión de CSAT falla', async () => {
      const ticket = await fixture('RESUELTO');
      await database.updateTable('tickets').set({ fechaResolucion: new Date(now.getTime() - 49 * 3_600_000) }).where('idTicket', '=', ticket.idTicket).execute();
      const failing = buildJobsService(database, async () => {}, async () => {}, { issue: async () => { throw new Error('Fallo simulado'); }, deliver: () => {} });
      await expect(failing.run('auto-close-resolved', now)).rejects.toThrow('Fallo simulado');
      expect((await current(ticket.idTicket)).fechaCierre).toBeNull();
      expect(await database.selectFrom('bitacora').selectAll().where('idTicket', '=', ticket.idTicket).execute()).toHaveLength(0);
    });
    it('permite auditar tareas a jefatura/auditor y deniega otros perfiles; no expone enlaces ajenos', async () => {
      const requester = await authenticated(app, 'ana.managua'); const auditor = await authenticated(app, 'auditor.demo');
      expect((await app.inject({ url: '/api/v1/tareas', headers: { cookie: requester.cookie } })).statusCode).toBe(403);
      const response = await app.inject({ url: '/api/v1/tareas', headers: { cookie: auditor.cookie } });
      expect(response.statusCode).toBe(200); expect(response.json().tareas).toHaveLength(6);
      const other = await authenticated(app, 'carlos.rivas');
      const invites = await app.inject({ url: '/api/v1/encuestas/invitaciones', headers: { cookie: other.cookie } });
      expect(invites.statusCode).toBe(200); expect(invites.body).not.toContain('/encuesta#');
      expect((await app.inject('/api/v1/encuestas/invitaciones')).statusCode).toBe(401);
    });
    it('verifica las dos cadenas de auditoría y respeta desactivación en BD', async () => {
      await jobs.run('audit-chain-verify', now);
      expect((await database.selectFrom('tareasProgramadas').selectAll().where('codigo', '=', 'audit-chain-verify').executeTakeFirstOrThrow()).ultimoResultado).toBe('CORRECTO');
      const ticket = await fixture(); await database.updateTable('tareasProgramadas').set({ activa: false }).where('codigo', '=', 'sla-breach-escalation').execute();
      await jobs.run('sla-breach-escalation', now); expect((await current(ticket.idTicket)).version).toBe(1);
    });
    it('cierre manual entrega enlace al dueño y permite responder CSAT sin sesión', async () => {
      const owner = await authenticated(app, 'ana.managua'); const analyst = await authenticated(app, 'analista.managua');
      const ownerHeaders = { cookie: owner.cookie, 'x-csrf-token': owner.session.csrfToken };
      const analystHeaders = { cookie: analyst.cookie, 'x-csrf-token': analyst.session.csrfToken };
      const created = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: ownerHeaders, payload: {
        titulo: 'Encuesta después de cierre manual', descripcion: 'Caso ficticio', tipo: 'INCIDENTE', idCategoria: 4,
        impacto: 'ALTO', urgencia: 'ALTA', idActivo: null, idSolicitante: 2, canalIngreso: 'PORTAL' } });
      expect(created.statusCode).toBe(201); const numero: string = created.json().numero;
      for (const [action, payload] of [
        ['asignar', { version: 1, idUsuario: 5, motivo: 'Toma del caso' }],
        ['atender', { version: 2 }], ['resolver', { accion: 'resolver', version: 3, causa: null, solucion: 'Solución ficticia' }],
      ] as const) expect((await app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/${action}`, headers: analystHeaders, payload })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/cerrar`, headers: ownerHeaders,
        payload: { accion: 'cerrar', version: 4, confirmacion: true } })).statusCode).toBe(200);
      const result = await app.inject({ url: '/api/v1/encuestas/invitaciones', headers: ownerHeaders });
      const invitation = result.json().data.find((entry: { numero: string }) => entry.numero === numero) as { enlace: string } | undefined;
      expect(invitation).toBeDefined(); const token = invitation?.enlace.split('#')[1] ?? '';
      const detail = await app.inject({ url: '/api/v1/encuestas/actual', headers: { 'x-survey-token': token } });
      expect(detail.statusCode).toBe(200);
      const answered = await app.inject({ method: 'POST', url: '/api/v1/encuestas/actual', headers: { 'x-survey-token': token, 'x-csrf-token': detail.json().csrfToken }, payload: { calificacion: 5 } });
      expect(answered.statusCode).toBe(200);
      const completed = await app.inject({ url: '/api/v1/encuestas/invitaciones', headers: ownerHeaders });
      expect(completed.json().data.some((entry: { numero: string }) => entry.numero === numero)).toBe(false);
      const ticket = await database.selectFrom('tickets').select('idTicket').where('numero', '=', numero).executeTakeFirstOrThrow();
      const logs = await database.selectFrom('bitacora').selectAll().where('idTicket', '=', ticket.idTicket).execute();
      expect(JSON.stringify(logs)).not.toContain(token);
    });
    it('pg-boss arranca con rol app sin DDL, registra seis cron y ejecuta un trabajo real', async () => {
      await database.insertInto('tareasProgramadas').values({ codigo: 'legacy-disabled', expresionCron: '0 0 * * *', activa: false }).execute();
      const run = vi.fn(async () => {});
      const errors: Error[] = [];
      const boss = await startQueue(env.DATABASE_URL, { ...jobs, run }, (error) => errors.push(error));
      try {
        expect(await boss.getSchedules()).toHaveLength(6);
        await boss.send('audit-chain-verify');
        await vi.waitFor(() => expect(run).toHaveBeenCalledWith('audit-chain-verify'), { timeout: 8000, interval: 50 });
        expect(errors).toHaveLength(0);
      } finally { await boss.stop({ graceful: true, timeout: 3000 }); }
    });
  });
}
