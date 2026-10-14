import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { knowledgeCreateSchema, knowledgeDetailSchema, knowledgeListSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createKnowledgeService, registerKnowledgeRoutes } from '../src/modules/knowledge/index.js';
import { authenticated } from './auth-http.js';

const input = (titulo: string) => knowledgeCreateSchema.parse({ titulo, resumen: 'Resumen de prueba', contenido: 'Procedimiento ficticio para pruebas.',
  idCategoria: 1, estado: 'BORRADOR', visibilidad: 'PUBLICO', motivoCambio: 'Versión inicial de prueba' });

export function knowledgeChecks(database: Database, env: Env) {
  describe('Conocimientos: permisos, publicación y versiones', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' }).execute();
      const auth = await createAuthService(database, env.CSRF_SECRET);
      app = await buildApp(env, async () => true, auth);
      registerKnowledgeRoutes(app, createKnowledgeService(database));
    });
    afterEach(async () => { await app.close(); });
    it('consulta pública requiere sesión y no expone versiones ni datos de autenticación', async () => {
      expect((await app.inject('/api/v1/conocimientos')).statusCode).toBe(401);
      const login = await authenticated(app, 'ana.managua');
      const response = await app.inject({ url: '/api/v1/conocimientos/1', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      expect(knowledgeDetailSchema.parse(response.json()).versiones).toEqual([]);
      expect(response.body).not.toMatch(/passwordHash|correo|tokenHash/);
      expect((await app.inject({ method: 'POST', url: '/api/v1/conocimientos', payload: input('No permitido'),
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } })).statusCode).toBe(403);
    });
    it('oculta borradores e internos al solicitante en listado, búsqueda y ficha', async () => {
      const editor = await authenticated(app, 'especialista.infra');
      const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(editor.rawToken, new Date());
      const service = createKnowledgeService(database);
      const draft = await service.create(context, input('KB-PRIVADO-BORRADOR'));
      const internal = await service.create(context, { ...input('KB-PRIVADO-INTERNO'), estado: 'PUBLICADO', visibilidad: 'INTERNO' });
      const reader = await authenticated(app, 'ana.managua');
      const headers = { cookie: reader.cookie };
      expect((await app.inject({ url: `/api/v1/conocimientos/${draft.idArticulo}`, headers })).statusCode).toBe(404);
      expect((await app.inject({ url: `/api/v1/conocimientos/${internal.idArticulo}`, headers })).statusCode).toBe(404);
      const response = await app.inject({ url: '/api/v1/conocimientos?q=KB-PRIVADO', headers });
      expect(knowledgeListSchema.parse(response.json()).data).toEqual([]);
    });
    it('auditor ve historial pero no escribe, también en service', async () => {
      const login = await authenticated(app, 'auditor.demo');
      const response = await app.inject({ url: '/api/v1/conocimientos/1', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      expect(knowledgeDetailSchema.parse(response.json()).versiones.length).toBeGreaterThan(0);
      expect((await app.inject({ method: 'POST', url: '/api/v1/conocimientos', payload: input('Auditor no escribe'),
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } })).statusCode).toBe(403);
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      await expect(createKnowledgeService(database).create(context, input('Auditor service'))).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('crea, publica y conserva versiones; rechaza cambios concurrentes', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const headers = { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken };
      const payload = input('KB-VERSIONES-PRUEBA');
      const created = await app.inject({ method: 'POST', url: '/api/v1/conocimientos', payload, headers });
      expect(created.statusCode).toBe(201);
      const article = knowledgeDetailSchema.parse(created.json());
      expect(article.versiones).toHaveLength(1);
      const url = `/api/v1/conocimientos/${article.idArticulo}`;
      const update = { ...payload, titulo: 'KB-VERSIONES-PUBLICADO', estado: 'PUBLICADO', versionActual: 1, motivoCambio: 'Publicación revisada' };
      const responses = await Promise.all([app.inject({ method: 'PUT', url, payload: update, headers }), app.inject({ method: 'PUT', url, payload: update, headers })]);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 409]);
      const saved = knowledgeDetailSchema.parse(responses.find((response) => response.statusCode === 200)?.json());
      expect(saved.versionActual).toBe(2);
      expect(saved.versiones.map((version) => version.titulo)).toEqual(['KB-VERSIONES-PUBLICADO', 'KB-VERSIONES-PRUEBA']);
      const audits = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'articulos_kb')
        .where('idEntidad', '=', String(article.idArticulo)).execute();
      expect(audits).toHaveLength(2);
      expect(audits.every((audit) => /^[a-f0-9]{64}$/.test(audit.hashRegistro))).toBe(true);
    });
    it('rechaza CSRF, categoría inválida y búsquedas de comodines literales', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const payload = input('KB-INVALIDO-PRUEBA');
      expect((await app.inject({ method: 'POST', url: '/api/v1/conocimientos', payload, headers: { cookie: login.cookie } })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/api/v1/conocimientos', payload: { ...payload, idCategoria: 999999 },
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } })).statusCode).toBe(400);
      const response = await app.inject({ url: '/api/v1/conocimientos?q=%25', headers: { cookie: login.cookie } });
      expect(knowledgeListSchema.parse(response.json()).data).toEqual([]);
      expect(await database.selectFrom('articulosKb').select('idArticulo').where('titulo', '=', payload.titulo).executeTakeFirst()).toBeUndefined();
    });
    it('revierte artículo y versión si falla auditoría', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      if (!context) throw new Error('Falta la sesión de prueba.');
      const count = () => database.selectFrom('articulosKbVersiones').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      const previous = await count();
      await expect(createKnowledgeService(database).create({ ...context, idSesion: '00000000-0000-0000-0000-000000000000' }, input('KB-ROLLBACK-PRUEBA')))
        .rejects.toMatchObject({ code: '23503' });
      expect(await database.selectFrom('articulosKb').select('idArticulo').where('titulo', '=', 'KB-ROLLBACK-PRUEBA').executeTakeFirst()).toBeUndefined();
      expect((await count()).total).toBe(previous.total);
    });
  });
}
