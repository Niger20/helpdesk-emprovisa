import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { parameterListSchema, parameterSchema } from '@helpdesk/contracts';
import type { ParameterKey } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createParametersService } from '../src/modules/settings/parameters/index.js';
import { createParametersRepository } from '../src/modules/settings/parameters/parameters.repository.js';
import { buildParametersService } from '../src/modules/settings/parameters/parameters.service.js';
import { createAttachmentsService } from '../src/modules/tickets/attachments/index.js';
import { authenticated, submitLogin } from './auth-http.js';

export function parametersChecks(database: Database, env: Env) {
  describe('Parámetros locales: límites, concurrencia y evidencia', () => {
    let app: FastifyInstance;
    const service = createParametersService(database);
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), undefined, undefined, undefined, undefined, { parameters: service });
    });
    afterEach(async () => {
      await app.close();
      for (const [clave, valor] of [['sesion.inactividad_minutos', '30'], ['login.bloqueo_minutos', '15'], ['adjunto.maximo_bytes', '10485760']]) {
        if (clave && valor) await database.insertInto('parametros').values({ clave, valor, tipoDato: 'ENTERO', modificadoEn: new Date() })
          .onConflict((conflict) => conflict.column('clave').doUpdateSet({ valor, tipoDato: 'ENTERO' })).execute();
      }
    });
    const loginContext = async () => {
      const login = await authenticated(app); const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      if (!context) throw new Error('Sesión de prueba ausente.');
      return { login, context };
    };
    const edit = async (clave: string, valor: number, valorAnterior: number) => {
      const login = await authenticated(app);
      return app.inject({ method: 'PUT', url: `/api/v1/admin/parametros/${clave}`, headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { valor, valorAnterior } });
    };
    it('deniega anónimo, solicitante, auditor y permiso local en service', async () => {
      expect((await app.inject('/api/v1/admin/parametros')).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const login = await authenticated(app, username); const headers = { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken };
        expect((await app.inject({ url: '/api/v1/admin/parametros', headers })).statusCode).toBe(403);
        expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/parametros/login.bloqueo_minutos', headers, payload: { valor: 20, valorAnterior: 15 } })).statusCode).toBe(403);
      }
      const { context } = await loginContext(); const local = { ...context, grants: [{ codigo: 'parametro.administrar' as const, idSedeAlcance: 1 }] };
      await expect(service.list(local)).rejects.toMatchObject({ statusCode: 403 });
      await expect(service.edit(local, 'login.bloqueo_minutos', { valor: 20, valorAnterior: 15 })).rejects.toMatchObject({ statusCode: 403 });
    });
    it('exige CSRF y expone solo la allowlist sin marcadores ni secretos', async () => {
      const { login, context } = await loginContext();
      const list = parameterListSchema.parse((await app.inject({ url: '/api/v1/admin/parametros', headers: { cookie: login.cookie } })).json());
      expect(list.data.map((row) => row.clave)).toEqual(['sesion.inactividad_minutos', 'login.bloqueo_minutos', 'adjunto.maximo_bytes', 'ticket.cierre_inactividad_horas']);
      expect(JSON.stringify(list)).not.toContain('demo.seed');
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/parametros/login.bloqueo_minutos', headers: { cookie: login.cookie }, payload: { valor: 20, valorAnterior: 15 } })).statusCode).toBe(403);
      expect((await edit('demo.seed.version', 2, 1)).statusCode).toBe(400);
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/parametros/login.bloqueo_minutos',
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { valor: 20, valorAnterior: 15, tipoDato: 'CADENA' } })).statusCode).toBe(400);
      await expect(service.edit(context, 'demo.seed.version' as ParameterKey, { valor: 2, valorAnterior: 1 })).rejects.toThrow();
    });
    it('conserva límites de seguridad, infraestructura y RN-06', async () => {
      for (const [clave, valor, anterior] of [['sesion.inactividad_minutos', 31, 30], ['login.bloqueo_minutos', 14, 15], ['adjunto.maximo_bytes', 10485761, 10485760]] as const) {
        expect((await edit(clave, valor, anterior)).statusCode).toBe(400);
      }
      expect((await edit('ticket.cierre_inactividad_horas', 48, 48)).statusCode).toBe(403);
      const { context } = await loginContext();
      await expect(service.edit(context, 'sesion.inactividad_minutos', { valor: 31, valorAnterior: 30 })).rejects.toThrow();
    });
    it('rechaza configuración corrupta y ausencia sin fallback real', async () => {
      const { context } = await loginContext();
      await database.updateTable('parametros').set({ tipoDato: 'CADENA', valor: 'secreto-ficticio-no-expuesto' }).where('clave', '=', 'adjunto.maximo_bytes').execute();
      await expect(service.list(context)).rejects.toMatchObject({ statusCode: 500 });
      await database.deleteFrom('parametros').where('clave', '=', 'adjunto.maximo_bytes').execute();
      await expect(service.list(context)).rejects.toMatchObject({ statusCode: 500 });
    });
    it('aplica el cambio al consumidor de sesión y registra evidencia mínima encadenada', async () => {
      const response = await edit('sesion.inactividad_minutos', 20, 30); expect(response.statusCode, response.body).toBe(200);
      expect(parameterSchema.parse(response.json()).valor).toBe(20);
      const { login, context } = await loginContext(); expect(context.idleMinutes).toBe(20);
      const auth = await createAuthService(database, env.CSRF_SECRET);
      expect(await auth.load(login.rawToken, new Date(Date.now() + 21 * 60_000))).toBeNull();
      const event = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'parametros').where('idEntidad', '=', 'sesion.inactividad_minutos').orderBy('idAuditoria', 'desc').executeTakeFirstOrThrow();
      expect(event.hashRegistro).toMatch(/^[0-9a-f]{64}$/); expect(event.direccionIp).toBe('127.0.0.1');
      expect(event.detalle).toEqual({ clave: 'sesion.inactividad_minutos', anterior: 30, nuevo: 20 });
    });
    it('aplica límite de adjuntos sin modificar tipo real ni hash y bloqueo tras cinco fallos', async () => {
      expect((await edit('adjunto.maximo_bytes', 1024, 10485760)).statusCode).toBe(200);
      const login = await authenticated(app, 'ana.managua'); const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      const ticket = await database.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado').select('t.numero')
        .where('t.idSolicitante', '=', login.session.usuario.idUsuario).where('e.codigo', 'not in', ['RESUELTO', 'CERRADO', 'CANCELADO'])
        .orderBy('t.idTicket', 'desc').executeTakeFirstOrThrow();
      const attachments = createAttachmentsService(database, env.STORAGE_DIR);
      expect(await attachments.uploadLimit(context, ticket.numero)).toBe(1024);
      await expect(attachments.upload(context, ticket.numero, 'exceso.pdf', Buffer.alloc(1025))).rejects.toMatchObject({ statusCode: 413 });
      expect((await edit('login.bloqueo_minutos', 20, 15)).statusCode).toBe(200);
      const start = Date.now();
      for (let attempt = 0; attempt < 5; attempt++) expect((await submitLogin(app, 'ana.managua', 'incorrecta-ficticia')).statusCode).toBe(401);
      const user = await database.selectFrom('usuarios').select(['intentosFallidos', 'bloqueadoHasta']).where('username', '=', 'ana.managua').executeTakeFirstOrThrow();
      expect(user.intentosFallidos).toBe(5); expect(user.bloqueadoHasta?.getTime()).toBeGreaterThanOrEqual(start + 20 * 60_000);
    });
    it('serializa cambios simultáneos también cuando el parámetro tiene fallback ausente', async () => {
      const { context } = await loginContext();
      await database.deleteFrom('parametros').where('clave', '=', 'login.bloqueo_minutos').execute();
      const fallback = (await service.list(context)).data.find((row) => row.clave === 'login.bloqueo_minutos');
      expect(fallback).toMatchObject({ valor: 15, origen: 'PREDETERMINADO' });
      const results = await Promise.allSettled([20, 25].map((valor) => service.edit(context, 'login.bloqueo_minutos', { valor, valorAnterior: 15 })));
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((result) => result.status === 'rejected');
      expect(rejected?.status === 'rejected' ? rejected.reason : null).toMatchObject({ statusCode: 409 });
    });
    it('revierte el upsert si falla auditoría', async () => {
      const { context } = await loginContext(); const repository = createParametersRepository(database);
      await database.deleteFrom('parametros').where('clave', '=', 'login.bloqueo_minutos').execute();
      const failing = buildParametersService({ ...repository, atomic: (action) => repository.atomic((repo) => action({ ...repo,
        audit: async () => { throw new Error('Evidencia indisponible'); } })) });
      await expect(failing.edit(context, 'login.bloqueo_minutos', { valor: 20, valorAnterior: 15 })).rejects.toThrow('Evidencia indisponible');
      expect(await repository.find('login.bloqueo_minutos')).toBeUndefined();
    });
  });
}
