import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ticketDetailSchema, ticketListSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

export function ticketsChecks(database: Database, env: Env) {
  describe('Tickets: alta, SLA y visibilidad', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database));
    });
    afterEach(async () => { await app.close(); });
    it('el solicitante solo recibe sus tickets y nunca notas internas', async () => {
      const login = await authenticated(app, 'ana.managua');
      const list = await app.inject({ url: '/api/v1/tickets', headers: { cookie: login.cookie } });
      expect(list.statusCode).toBe(200);
      const result = ticketListSchema.parse(list.json());
      expect(result.data.every((ticket) => ticket.solicitante === 'Ana López (demo)')).toBe(true);
      expect(result.data).toHaveLength(3);
      const detail = await app.inject({ url: '/api/v1/tickets/TK-000004', headers: { cookie: login.cookie } });
      expect(ticketDetailSchema.parse(detail.json()).comentarios.every((comment) => comment.visibilidad === 'PUBLICO')).toBe(true);
      expect(detail.body).not.toContain('Nota técnica');
      expect(detail.body).not.toContain('idTicket');
      expect((await app.inject({ url: '/api/v1/tickets/TK-000001', headers: { cookie: login.cookie } })).statusCode).toBe(404);
    });
    it('N1 ve la sede propia y N2 únicamente sus asignaciones o grupos', async () => {
      const n1 = await authenticated(app, 'analista.leon');
      const result = ticketListSchema.parse((await app.inject({ url: '/api/v1/tickets', headers: { cookie: n1.cookie } })).json());
      expect(result.data).toHaveLength(2);
      expect(result.data.every((ticket) => ticket.sede === 'Sede León')).toBe(true);
      const n2 = await authenticated(app, 'especialista.infra');
      const group = ticketListSchema.parse((await app.inject({ url: '/api/v1/tickets', headers: { cookie: n2.cookie } })).json());
      expect(group.data.map((ticket) => ticket.numero).sort()).toEqual(['TK-000004', 'TK-000005', 'TK-000008']);
    });
    it('el auditor consulta todos pero no puede registrar tickets', async () => {
      const login = await authenticated(app, 'auditor.demo');
      expect(ticketListSchema.parse((await app.inject({ url: '/api/v1/tickets', headers: { cookie: login.cookie } })).json()).meta.total).toBe(9);
      expect((await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: {} })).statusCode).toBe(403);
    });
    const payload = { titulo: 'Nuevo incidente de correo', descripcion: 'El correo presenta una falla de sincronización.', tipo: 'INCIDENTE', idCategoria: 4,
      impacto: 'ALTO', urgencia: 'ALTA', idActivo: null, idSolicitante: 2, canalIngreso: 'PORTAL' };
    it('valida activo obligatorio, terceros y tipo de categoría antes de escribir', async () => {
      const login = await authenticated(app, 'ana.managua');
      const create = (changes: object) => app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { ...payload, ...changes } });
      expect((await create({ idCategoria: 1 })).statusCode).toBe(400);
      expect((await create({ idSolicitante: 3, canalIngreso: 'TELEFONO' })).statusCode).toBe(403);
      expect((await create({ idCategoria: 2 })).statusCode).toBe(400);
      expect(await database.selectFrom('tickets').select('idTicket').execute()).toHaveLength(9);
    });
    it('crea ticket, prioridad, plazos, alerta y bitácora transaccionales', async () => {
      const login = await authenticated(app, 'ana.managua');
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload });
      expect(response.statusCode).toBe(201);
      const result = ticketListSchema.parse((await app.inject({ url: '/api/v1/tickets?estado=NUEVO&prioridad=P1', headers: { cookie: login.cookie } })).json());
      const created = result.data.find((ticket) => ticket.titulo === payload.titulo);
      expect(created?.prioridad).toBe('P1');
      expect(new Date(created?.fechaLimiteSolucion ?? '').getTime() - new Date(created?.fechaCreacion ?? '').getTime()).toBe(120 * 60_000);
      const row = await database.selectFrom('tickets').selectAll().where('titulo', '=', payload.titulo).executeTakeFirstOrThrow();
      expect(row.idRegistradoPor).toBe(2);
      const evidence = await database.selectFrom('bitacora').select('accion').where('idTicket', '=', row.idTicket).execute();
      expect(evidence.map((event) => event.accion).sort()).toEqual(['CREACION', 'SLA_CALENDARIO_FIJADO']);
      expect(await database.selectFrom('slaAlertas').select('idAlerta').where('idTicket', '=', row.idTicket).execute()).toHaveLength(1);
    });
  });
}
