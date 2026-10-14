import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { calendarInputSchema, calendarSchema, calendarSnapshotSchema } from '@helpdesk/contracts';
import type { Calendar, CalendarInput, TicketCreate } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import type { SessionContext } from '../src/modules/auth/index.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createCalendarsService } from '../src/modules/settings/calendars/index.js';
import { createCalendarsRepository } from '../src/modules/settings/calendars/calendars.repository.js';
import { buildCalendarsService } from '../src/modules/settings/calendars/calendars.service.js';
import { buildTicketsService, captureTicketCalendar, calcularLimiteReapertura } from '../src/modules/tickets/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

let sequence = 0;
export function calendarsChecks(database: Database, env: Env) {
  describe('Calendarios: configuración y ciclos SLA protegidos', () => {
    let app: FastifyInstance; let originalCalendar: number;
    const service = createCalendarsService(database); const tickets = buildTicketsService(database);
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      originalCalendar = (await database.selectFrom('sedes').select('idCalendario').where('idSede', '=', 1).executeTakeFirstOrThrow()).idCalendario;
      for (const row of await database.selectFrom('tickets').select(['idTicket', 'idSede', 'numeroReaperturas']).orderBy('idTicket').execute()) {
        const snapshot = await database.selectFrom('bitacora').select('idBitacora').where('idTicket', '=', row.idTicket).where('accion', '=', 'SLA_CALENDARIO_FIJADO')
          .where('valorNuevo', '@>', JSON.stringify({ ciclo: row.numeroReaperturas + 1 })).executeTakeFirst();
        if (!snapshot) await database.transaction().execute((trx) => captureTicketCalendar(trx, row, new Date()));
      }
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), tickets, undefined, undefined, undefined, { calendars: service });
    });
    afterEach(async () => { await app.close(); await database.updateTable('sedes').set({ idCalendario: originalCalendar }).where('idSede', '=', 1).execute(); });
    const login = () => authenticated(app);
    const context = async (username = 'admin.emergencia') => {
      const session = await authenticated(app, username); const result = await (await createAuthService(database, env.CSRF_SECRET)).load(session.rawToken, new Date());
      if (!result) throw new Error('Falta contexto de calendario.'); return result;
    };
    const input = (): CalendarInput => ({ nombre: `Calendario de prueba ${++sequence}`, zonaHoraria: 'America/Managua',
      horarios: [1, 2, 3, 4, 5].map((diaSemana) => ({ diaSemana, horaInicio: '08:00', horaFin: '17:00' })), feriados: [] });
    const update = (row: Calendar, change: Partial<CalendarInput> = {}) => ({ ...calendarInputSchema.strip().parse(row), ...change, anterior: calendarInputSchema.strip().parse(row) });
    const version = (numero: string) => database.selectFrom('tickets').select('version').where('numero', '=', numero).executeTakeFirstOrThrow();
    const command = async (actor: SessionContext, numero: string, accion: 'pausar' | 'reanudar' | 'resolver' | 'cerrar' | 'reabrir', now: Date) => {
      const current = (await version(numero)).version;
      if (accion === 'pausar') return tickets.lifecycle(actor, numero, { accion, version: current, motivo: 'REPUESTOS', detalle: 'Espera ficticia', referenciaExterna: null }, now);
      if (accion === 'resolver') return tickets.lifecycle(actor, numero, { accion, version: current, causa: 'Prueba local', solucion: 'Solución ficticia verificada.' }, now);
      if (accion === 'cerrar') return tickets.lifecycle(actor, numero, { accion, version: current, confirmacion: true }, now);
      return tickets.lifecycle(actor, numero, { accion, version: current, motivo: 'Prueba de calendario protegido' }, now);
    };
    const payload: TicketCreate = { titulo: 'Calendario en ciclo SLA', descripcion: 'Prueba de horario laboral con fotografía por ciclo.', tipo: 'INCIDENTE', idCategoria: 4,
      impacto: 'BAJO', urgencia: 'BAJA', idActivo: null, idSolicitante: 2, canalIngreso: 'PORTAL' };
    it('exige permiso global en rutas/service y CSRF al guardar', async () => {
      expect((await app.inject('/api/v1/admin/calendarios')).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const session = await authenticated(app, username);
        expect((await app.inject({ url: '/api/v1/admin/calendarios', headers: { cookie: session.cookie } })).statusCode).toBe(403);
      }
      const session = await login();
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/calendarios', headers: { cookie: session.cookie }, payload: input() })).statusCode).toBe(403);
      await expect(service.list({ ...await context(), grants: [{ codigo: 'parametro.administrar', idSedeAlcance: 1 }] }, { page: 1, pageSize: 20 })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('crea y valida horarios, feriados y evidencia atómica', async () => {
      const session = await login(); const headers = { cookie: session.cookie, 'x-csrf-token': session.session.csrfToken };
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/calendarios', headers, payload: { ...input(), feriados: [{ fecha: '2026-10-19', descripcion: 'Feriado ficticio' }] } });
      expect(response.statusCode, response.body).toBe(201); const calendar = calendarSchema.parse(response.json());
      expect(calendar.feriados).toHaveLength(1); expect(calendar.horarios).toHaveLength(5);
      for (const invalid of [{ ...input(), horarios: [] }, { ...input(), zonaHoraria: 'UTC' }, { ...input(), idCalendario: 9 }]) {
        expect((await app.inject({ method: 'POST', url: '/api/v1/admin/calendarios', headers, payload: invalid })).statusCode).toBe(400);
      }
      const audit = await database.selectFrom('auditoriaSistema').select(['hashRegistro', 'direccionIp']).where('entidad', '=', 'calendarios_laborales').where('idEntidad', '=', String(calendar.idCalendario)).executeTakeFirstOrThrow();
      expect(audit.hashRegistro).toMatch(/^[a-f0-9]{64}$/); expect(audit.direccionIp).toBe('127.0.0.1');
    });
    it('rechaza edición concurrente y conserva configuración sin cambios parciales', async () => {
      const actor = await context(); const calendar = await service.create(actor, input());
      const results = await Promise.allSettled(['Primero', 'Segundo'].map((nombre) => service.edit(actor, calendar.idCalendario, update(calendar, { nombre }))));
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      const rejected = results.find((result) => result.status === 'rejected'); if (rejected?.status === 'rejected') expect(rejected.reason).toMatchObject({ statusCode: 409 });
      expect((await service.detail(actor, calendar.idCalendario)).horarios).toHaveLength(5);
    });
    it('cambios de calendario y sede aplican a nuevas altas; el ciclo anterior conserva consumo y fechas', async () => {
      const actor = await context(); const owner = await context('ana.managua'); const calendar = await service.create(actor, input());
      await service.bind(actor, calendar.idCalendario, 1, originalCalendar);
      const start = new Date('2026-10-19T14:00:00Z'); const measure = new Date('2026-10-20T15:00:00Z');
      const old = await tickets.create(owner, payload, start); const before = (await tickets.detail(owner, old.numero, measure)).ticket;
      await service.edit(actor, calendar.idCalendario, update(calendar, { feriados: [{ fecha: '2026-10-19', descripcion: 'Feriado nuevo' }] }));
      const next = await tickets.create(owner, payload, start); const after = (await tickets.detail(owner, old.numero, measure)).ticket;
      expect(after.fechaLimiteSolucion).toBe(before.fechaLimiteSolucion); expect(after.porcentajeConsumido).toBe(before.porcentajeConsumido);
      expect((await tickets.detail(owner, next.numero, measure)).ticket.fechaLimiteSolucion).not.toBe(before.fechaLimiteSolucion);
      await expect(service.bind(actor, calendar.idCalendario, 1, originalCalendar)).rejects.toMatchObject({ statusCode: 409 });
    });
    it('pausar, reanudar, resolver y reabrir usan el calendario correcto por ciclo', async () => {
      const admin = await context(); const owner = await context('ana.managua'); const analyst = await context('especialista.infra'); const calendar = await service.create(admin, input());
      await service.bind(admin, calendar.idCalendario, 1, originalCalendar);
      const start = new Date('2026-10-19T14:00:00Z'); const at = (minutes: number) => new Date(start.getTime() + minutes * 60000);
      const category = await database.insertInto('categorias').values({ nombre: 'Prueba de pausa calendario', tipoAplicable: 'INCIDENTE', requiereActivo: false, idGrupoDefault: 2, orden: 99, activa: true }).returning('idCategoria').executeTakeFirstOrThrow();
      const ticket = await tickets.create(owner, { ...payload, idCategoria: category.idCategoria }, start);
      await tickets.assign(analyst, ticket.numero, { version: (await version(ticket.numero)).version, idUsuario: analyst.usuario.idUsuario, motivo: 'Toma de prueba' }, at(1));
      await tickets.attend(analyst, ticket.numero, { version: (await version(ticket.numero)).version }, at(2));
      await command(analyst, ticket.numero, 'pausar', at(3));
      const updated = await service.edit(admin, calendar.idCalendario, update(calendar, { feriados: [{ fecha: '2026-10-19', descripcion: 'Nuevo feriado' }, { fecha: '2026-10-20', descripcion: 'Segundo feriado' }] }));
      await command(analyst, ticket.numero, 'reanudar', at(63));
      const row = await database.selectFrom('tickets').select(['idTicket', 'minutosPausa']).where('numero', '=', ticket.numero).executeTakeFirstOrThrow(); expect(row.minutosPausa).toBe(60);
      await command(analyst, ticket.numero, 'resolver', at(90)); await command(owner, ticket.numero, 'cerrar', at(91));
      const options = await tickets.lifecycleOptions(owner, ticket.numero, at(92));
      expect(options.fechaLimiteReapertura).toBe(calcularLimiteReapertura(at(91), { zonaHoraria: calendar.zonaHoraria, horarios: calendar.horarios, feriados: [] }).toISOString());
      expect(options.acciones).toContain('reabrir'); await command(owner, ticket.numero, 'reabrir', at(92));
      const snapshots = await database.selectFrom('bitacora').select('valorNuevo').where('idTicket', '=', row.idTicket).where('accion', '=', 'SLA_CALENDARIO_FIJADO').orderBy('idBitacora').execute();
      expect(snapshots).toHaveLength(2);
      const current = snapshots[1]?.valorNuevo; if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Snapshot ausente.');
      expect(calendarSnapshotSchema.parse(current.calendario).feriados).toEqual(updated.feriados.map((day) => day.fecha));
    });
    it('bloquea cambios si falta fotografía y revierte si falla evidencia', async () => {
      const actor = await context(); const calendar = await service.create(actor, input());
      const originalCycle = (await database.selectFrom('tickets').select('numeroReaperturas').where('numero', '=', 'TK-000001').executeTakeFirstOrThrow()).numeroReaperturas;
      await database.updateTable('tickets').set({ numeroReaperturas: 999 }).where('numero', '=', 'TK-000001').execute();
      try { const old = await service.detail(actor, originalCalendar); await expect(service.edit(actor, old.idCalendario, update(old, { nombre: 'No guardar' }))).rejects.toMatchObject({ statusCode: 409 }); }
      finally { await database.updateTable('tickets').set({ numeroReaperturas: originalCycle }).where('numero', '=', 'TK-000001').execute(); }
      const repo = createCalendarsRepository(database);
      const failing = buildCalendarsService({ ...repo, atomic: (action) => repo.atomic((trx) => action({ ...trx, audit: async () => { throw new Error('Sin evidencia'); } })) });
      await expect(failing.edit(actor, calendar.idCalendario, update(calendar, { nombre: 'No guardar', feriados: [{ fecha: '2026-10-19', descripcion: 'No guardar' }] }))).rejects.toThrow('Sin evidencia');
      const after = await service.detail(actor, calendar.idCalendario); expect(after.nombre).toBe(calendar.nombre); expect(after.feriados).toEqual([]);
    });
  });
}
