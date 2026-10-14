import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ticketOperationSchema, ticketDetailSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

export function ticketOperationsChecks(database: Database, env: Env) {
  describe('Operación de tickets: concurrencia, asignación, atención y comentarios', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database));
    });
    afterEach(async () => { await app.close(); });
    const post = (numero: string, action: string, login: Awaited<ReturnType<typeof authenticated>>, payload: object) =>
      app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/${action}`, payload, headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } });
    const create = async (username = 'ana.managua', idSolicitante = 2) => {
      const login = await authenticated(app, username);
      const response = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken },
        payload: { titulo: `Incidente de operación ${randomUUID()}`, descripcion: 'Prueba del flujo operativo', tipo: 'INCIDENTE', idCategoria: 4,
          impacto: 'MEDIO', urgencia: 'MEDIA', idActivo: null, idSolicitante, canalIngreso: 'PORTAL' } });
      expect(response.statusCode).toBe(201);
      const value = response.json<{ numero: string }>();
      return { numero: value.numero, login };
    };
    const row = (numero: string) => database.selectFrom('tickets').selectAll().where('numero', '=', numero).executeTakeFirstOrThrow();
    it('toma e inicia atención sin reiniciar los plazos ni sobrescribir primera respuesta', async () => {
      const { numero } = await create();
      const analyst = await authenticated(app, 'analista.managua');
      const initial = await row(numero);
      expect((await post(numero, 'asignar', analyst, { version: 1, idUsuario: 5, motivo: 'Toma de caso' })).statusCode).toBe(200);
      expect((await post(numero, 'atender', analyst, { version: 2 })).statusCode).toBe(200);
      const current = await row(numero);
      expect(current.idAsignado).toBe(5); expect(current.version).toBe(3);
      expect(current.fechaPrimeraRespuesta).toBeInstanceOf(Date);
      expect(current.fechaLimiteRespuesta).toEqual(initial.fechaLimiteRespuesta);
      expect(current.fechaLimiteSolucion).toEqual(initial.fechaLimiteSolucion);
      expect((await post(numero, 'atender', analyst, { version: 3 })).statusCode).toBe(409);
      expect((await row(numero)).fechaPrimeraRespuesta).toEqual(current.fechaPrimeraRespuesta);
      expect(await database.selectFrom('ticketAsignaciones').selectAll().where('idTicket', '=', initial.idTicket).where('hasta', 'is', null).execute()).toHaveLength(1);
    });
    it('escribe notas internas y comentarios públicos, sin filtrar contenido interno al solicitante', async () => {
      const { numero, login } = await create();
      const analyst = await authenticated(app, 'analista.managua');
      expect((await post(numero, 'comentarios', analyst, { version: 1, contenido: 'Nota reservada de operación', visibilidad: 'INTERNO' })).statusCode).toBe(201);
      expect((await post(numero, 'comentarios', login, { version: 2, contenido: 'El incidente continúa', visibilidad: 'PUBLICO' })).statusCode).toBe(201);
      const response = await app.inject({ url: `/api/v1/tickets/${numero}`, headers: { cookie: login.cookie } });
      expect(response.body).not.toContain('Nota reservada'); expect(response.body).not.toContain('COMENTARIO_INTERNO');
      expect(ticketDetailSchema.parse(response.json()).comentarios).toHaveLength(1);
      expect((await row(numero)).fechaPrimeraRespuesta).toBeNull();
      expect((await post(numero, 'comentarios', login, { version: 3, contenido: 'Intento de nota', visibilidad: 'INTERNO' })).statusCode).toBe(403);
    });
    it('un analista solicitante no lee ni escribe notas internas de su propio caso', async () => {
      const { numero, login } = await create('analista.managua', 5);
      const chief = await authenticated(app);
      expect((await post(numero, 'comentarios', chief, { version: 1, contenido: 'Nota para el equipo', visibilidad: 'INTERNO' })).statusCode).toBe(201);
      const response = await app.inject({ url: `/api/v1/tickets/${numero}`, headers: { cookie: login.cookie } });
      expect(response.body).not.toContain('Nota para el equipo');
      expect((await post(numero, 'comentarios', login, { version: 2, contenido: 'Nota propia', visibilidad: 'INTERNO' })).statusCode).toBe(403);
    });
    it('auditor no escribe, N1 ajeno no ve, y CSRF no puede omitirse', async () => {
      const { numero } = await create();
      const auditor = await authenticated(app, 'auditor.demo');
      const other = await authenticated(app, 'analista.rivas');
      const analyst = await authenticated(app, 'analista.managua');
      expect((await post(numero, 'asignar', auditor, { version: 1, idUsuario: 5, motivo: 'No permitido' })).statusCode).toBe(403);
      expect((await post(numero, 'comentarios', auditor, { version: 1, contenido: 'No permitido', visibilidad: 'PUBLICO' })).statusCode).toBe(403);
      expect((await post(numero, 'asignar', other, { version: 1, idUsuario: 8, motivo: 'Otra sede' })).statusCode).toBe(404);
      expect((await app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/asignar`, headers: { cookie: analyst.cookie }, payload: { version: 1, idUsuario: 5, motivo: 'Sin CSRF' } })).statusCode).toBe(403);
    });
    it('dos tomas concurrentes dejan una sola asignación y devuelven conflicto de versión', async () => {
      const { numero } = await create(); const analyst = await authenticated(app, 'analista.managua');
      const responses = await Promise.all([post(numero, 'asignar', analyst, { version: 1, idUsuario: 5, motivo: 'Toma A' }), post(numero, 'asignar', analyst, { version: 1, idUsuario: 5, motivo: 'Toma B' })]);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 409]);
      const ticket = await row(numero);
      expect(await database.selectFrom('ticketAsignaciones').selectAll().where('idTicket', '=', ticket.idTicket).execute()).toHaveLength(1);
      expect(responses.find((response) => response.statusCode === 409)?.json<{ code: string }>().code).toBe('CONFLICTO_VERSION');
    });
    it('solo jefatura reasigna y el destino requiere grupo, permisos y vigencia', async () => {
      const { numero } = await create(); const analyst = await authenticated(app, 'analista.managua'); const chief = await authenticated(app);
      expect((await post(numero, 'asignar', analyst, { version: 1, idUsuario: 6, motivo: 'No es su grupo' })).statusCode).toBe(403);
      expect((await post(numero, 'asignar', chief, { version: 1, idUsuario: 6, motivo: 'Destino inválido' })).statusCode).toBe(400);
      expect((await post(numero, 'asignar', chief, { version: 1, idUsuario: 5, motivo: 'Asignación de jefatura' })).statusCode).toBe(200);
      expect((await post(numero, 'asignar', analyst, { version: 2, idUsuario: 5, motivo: 'Reasignación propia' })).statusCode).toBe(403);
      expect((await post(numero, 'atender', chief, { version: 2 })).statusCode).toBe(403);
    });
    it('un ticket de Rivas usa el grupo de su sede y su analista puede tomarlo', async () => {
      const { numero } = await create('carlos.rivas', 3); const analyst = await authenticated(app, 'analista.rivas');
      expect((await row(numero)).idGrupo).toBe(3);
      const response = await app.inject({ url: `/api/v1/tickets/${numero}/operacion`, headers: { cookie: analyst.cookie } });
      expect(ticketOperationSchema.parse(response.json()).puedeTomar).toBe(true);
      expect((await post(numero, 'asignar', analyst, { version: 1, idUsuario: 8, motivo: 'Atención en Rivas' })).statusCode).toBe(200);
    });
    it('no permite reanudar una pausa usando iniciar atención ni comentar un caso cerrado', async () => {
      const specialist = await authenticated(app, 'especialista.infra');
      const paused = await row('TK-000004');
      expect((await post('TK-000004', 'atender', specialist, { version: paused.version })).statusCode).toBe(409);
      const closed = await row('TK-000007'); const requester = await authenticated(app, 'ana.managua');
      expect((await post('TK-000007', 'comentarios', requester, { version: closed.version, contenido: 'Caso cerrado', visibilidad: 'PUBLICO' })).statusCode).toBe(409);
    });
  });
}
