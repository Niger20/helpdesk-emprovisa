import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ticketActionResultSchema, ticketDetailSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { createTicketsService } from '../src/modules/tickets/tickets.service.js';
import { createTicketsRepository, withTicketsTransaction } from '../src/modules/tickets/tickets.repository.js';
import { authenticated } from './auth-http.js';

export function requesterRegistrationChecks(database: Database, env: Env) {
  describe('RN-08: alta alterna por analista a nombre de otro solicitante', () => {
    let app: FastifyInstance;
    let sequence = 0;
    const input = {
      titulo: 'RN-08 falla de acceso al portal', descripcion: 'El usuario llama porque no puede acceder al sistema de tickets.',
      tipo: 'INCIDENTE' as const, idCategoria: 4, idActivo: null, impacto: 'ALTO' as const,
      urgencia: 'ALTA' as const, idSolicitante: 2, canalIngreso: 'TELEFONO' as const,
    };
    const snapshot = async () => {
      const tables = ['tickets', 'bitacora', 'slaAlertas', 'ticketAsignaciones', 'notificaciones'] as const;
      return Promise.all(tables.map(async (table) => {
        const count = await database.selectFrom(table).select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
        return Number(count.total);
      }));
    };
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      const category = await database.insertInto('categorias').values({ nombre: `Categoría RN-08 ${++sequence}`,
        tipoAplicable: 'INCIDENTE', requiereActivo: false, idGrupoDefault: null, activa: true, orden: 99 })
        .returning('idCategoria').executeTakeFirstOrThrow();
      input.idCategoria = category.idCategoria;
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database));
    });
    afterEach(async () => { await app.close(); });

    it.each(['TELEFONO', 'PRESENCIAL'] as const)('registra con canal %s, identidades distintas, sede del solicitante y evidencia', async (canalIngreso) => {
      const login = await authenticated(app, 'analista.managua');
      expect(login.session.usuario.permisos).toContain('ticket.registrar_tercero');
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets',
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { ...input, canalIngreso } });
      expect(response.statusCode).toBe(201);
      const { numero } = ticketActionResultSchema.parse(response.json());
      const row = await database.selectFrom('tickets').selectAll().where('numero', '=', numero).executeTakeFirstOrThrow();
      expect(row).toMatchObject({ idSolicitante: 2, idRegistradoPor: 5, idSede: 1, canalIngreso });
      expect(row.idRegistradoPor).not.toBe(row.idSolicitante);
      const creation = await database.selectFrom('bitacora').selectAll().where('idTicket', '=', row.idTicket).where('accion', '=', 'CREACION').execute();
      expect(creation).toHaveLength(1);
      expect(creation[0]).toMatchObject({ idUsuario: 5, automatica: false });
      expect(creation[0]?.idSesion).not.toBeNull();
      expect(creation[0]?.hashRegistro).toMatch(/^[a-f0-9]{64}$/);
      expect(await database.selectFrom('slaAlertas').select('idAlerta').where('idTicket', '=', row.idTicket).execute()).toHaveLength(1);
      const owner = await authenticated(app, 'ana.managua');
      const detail = await app.inject({ url: `/api/v1/tickets/${numero}`, headers: { cookie: owner.cookie } });
      expect(detail.statusCode).toBe(200);
      expect(ticketDetailSchema.parse(detail.json()).ticket.solicitante).toBe('Ana López (demo)');
    });

    it.each([
      { username: 'ana.managua', changes: { idSolicitante: 5 }, status: 403 },
      { username: 'analista.managua', changes: { idSolicitante: 3 }, status: 403 },
      { username: 'analista.managua', changes: { canalIngreso: 'PORTAL' }, status: 400 },
      { username: 'analista.managua', changes: { canalIngreso: 'CORREO' }, status: 400 },
      { username: 'auditor.demo', changes: {}, status: 403 },
    ])('deniega alta inválida: $username / $changes, sin escrituras del ticket', async ({ username, changes, status }) => {
      const login = await authenticated(app, username);
      const before = await snapshot();
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets',
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { ...input, ...changes } });
      expect(response.statusCode).toBe(status);
      expect(await snapshot()).toEqual(before);
    });

    it('exige CSRF también al registrar a terceros y no crea evidencia de ticket', async () => {
      const login = await authenticated(app, 'analista.managua');
      const before = await snapshot();
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie }, payload: input });
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ code: 'CSRF_INVALIDO' });
      expect(await snapshot()).toEqual(before);
    });

    it('el servicio exige el permiso de terceros aunque se omita la ruta HTTP', async () => {
      const login = await authenticated(app, 'ana.managua');
      const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      const before = await snapshot();
      await expect(buildTicketsService(database).create(context, { ...input, idSolicitante: 5 }))
        .rejects.toMatchObject({ code: 'NO_AUTORIZADO', statusCode: 403 });
      expect(await snapshot()).toEqual(before);
    });

    it('revierte ticket, bitácora y fotografía del calendario si falla la alerta dentro de la transacción', async () => {
      const login = await authenticated(app, 'analista.managua');
      const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      const failure = new Error('Fallo de alerta provocado por RN-08');
      let insertedId: number | undefined;
      let eventsBeforeFailure: string[] = [];
      const service = createTicketsService(createTicketsRepository(database), (action) => withTicketsTransaction(database, async (repo) => action({
        ...repo,
        insert: async (ticket) => { insertedId = ticket.idTicket; return repo.insert(ticket); },
        alert: async () => {
          eventsBeforeFailure = (await repo.executor.selectFrom('bitacora').select('accion')
            .where('idTicket', '=', insertedId ?? 0).execute()).map((event) => event.accion).sort();
          throw failure;
        },
      })));
      const before = await snapshot();
      await expect(service.create(context, input)).rejects.toBe(failure);
      expect(insertedId).toBeDefined();
      expect(eventsBeforeFailure).toEqual(['CREACION', 'SLA_CALENDARIO_FIJADO']);
      expect(await snapshot()).toEqual(before);
      expect(await database.selectFrom('bitacora').select('idBitacora').where('idTicket', '=', insertedId ?? 0).execute()).toHaveLength(0);
      expect(await database.selectFrom('tickets').select('idTicket').where('idTicket', '=', insertedId ?? 0).execute()).toHaveLength(0);
    });
  });
}
