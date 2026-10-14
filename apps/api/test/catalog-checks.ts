import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { categoryInputSchema, categoryListSchema, categorySchema } from '@helpdesk/contracts';
import type { Category, CategoryInput } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createCatalogService } from '../src/modules/catalog/index.js';
import { createCatalogRepository } from '../src/modules/catalog/catalog.repository.js';
import { buildCatalogService } from '../src/modules/catalog/catalog.service.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { authenticated } from './auth-http.js';

let sequence = 0;
export function catalogChecks(database: Database, env: Env) {
  describe('Categorías administrativas: integridad y autorización', () => {
    let app: FastifyInstance;
    const service = createCatalogService(database);
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), buildTicketsService(database), undefined, undefined, undefined, { catalog: service });
    });
    afterEach(async () => { await app.close(); });
    const input = (values: Partial<CategoryInput> = {}) => ({ nombre: `Categoría de prueba ${++sequence}`, idPadre: null,
      tipoAplicable: 'AMBOS' as const, requiereActivo: false, idGrupoDefault: 1, orden: 10, activa: true, ...values });
    const headers = async () => { const login = await authenticated(app); return { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }; };
    const create = async (data = input()) => {
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/categorias', headers: await headers(), payload: data });
      expect(response.statusCode, response.body).toBe(201); return categorySchema.parse(response.json());
    };
    const edit = async (category: Category, change: Partial<CategoryInput>) => app.inject({ method: 'PUT', url: `/api/v1/admin/categorias/${category.idCategoria}`,
      headers: await headers(), payload: { ...categoryInputSchema.strip().parse(category), ...change, anterior: categoryInputSchema.strip().parse(category) } });
    it('deniega anónimo, solicitante, auditor y permiso limitado en service', async () => {
      expect((await app.inject('/api/v1/admin/categorias')).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const login = await authenticated(app, username);
        expect((await app.inject({ url: '/api/v1/admin/categorias/catalogos', headers: { cookie: login.cookie } })).statusCode).toBe(403);
        expect((await app.inject({ method: 'POST', url: '/api/v1/admin/categorias', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: input() })).statusCode).toBe(403);
      }
      const login = await authenticated(app); const auth = await createAuthService(database, env.CSRF_SECRET); const context = await auth.load(login.rawToken, new Date());
      if (!context) throw new Error('No hay sesión de prueba.');
      await expect(service.list({ ...context, grants: [{ codigo: 'parametro.administrar', idSedeAlcance: 1 }] }, { page: 1, pageSize: 20, q: '', estado: 'TODAS' })).rejects.toMatchObject({ statusCode: 403 });
    });
    it('exige CSRF y payload estricto, rechaza grupos inválidos', async () => {
      const login = await authenticated(app);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/categorias', headers: { cookie: login.cookie }, payload: input() })).statusCode).toBe(403);
      for (const data of [{ ...input(), idCategoria: 1000 }, input({ orden: 32768 }), input({ idGrupoDefault: 99999 })]) {
        expect((await app.inject({ method: 'POST', url: '/api/v1/admin/categorias', headers: await headers(), payload: data })).statusCode).toBe(400);
      }
    });
    it('crea, busca, pagina y escribe evidencia encadenada con IP', async () => {
      const category = await create(input({ nombre: 'Categoría 100% única' }));
      const response = await app.inject({ url: '/api/v1/admin/categorias?q=100%25&pageSize=1', headers: await headers() });
      const list = categoryListSchema.parse(response.json()); expect(list.data.map((row) => row.idCategoria)).toEqual([category.idCategoria]); expect(list.meta.total).toBe(1);
      const event = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'categorias').where('idEntidad', '=', String(category.idCategoria)).executeTakeFirstOrThrow();
      expect(event.hashRegistro).toMatch(/^[0-9a-f]{64}$/); expect(event.direccionIp).toBe('127.0.0.1'); expect(JSON.stringify(event.detalle)).not.toContain('csrfToken');
      expect((await app.inject({ url: '/api/v1/admin/categorias?q=inexistente-xyz', headers: await headers() })).json().data).toEqual([]);
    });
    it('valida ciclos, padres activos y desactivación de jerarquías', async () => {
      const parent = await create(); const child = await create(input({ idPadre: parent.idCategoria }));
      expect((await edit(parent, { idPadre: child.idCategoria })).statusCode).toBe(400);
      expect((await edit(parent, { activa: false })).statusCode).toBe(400);
      expect((await edit(child, { activa: false })).statusCode).toBe(200);
      expect((await edit(parent, { activa: false })).statusCode).toBe(200);
      expect((await create(input({ activa: false, idPadre: parent.idCategoria }))).activa).toBe(false);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/categorias', headers: await headers(), payload: input({ idPadre: parent.idCategoria }) })).statusCode).toBe(400);
    });
    it('rechaza ediciones simultáneas con la misma referencia anterior', async () => {
      const category = await create(); const h = await headers();
      const payload = { ...categoryInputSchema.strip().parse(category), anterior: categoryInputSchema.strip().parse(category) };
      const results = await Promise.all(['Primera', 'Segunda'].map((nombre) => app.inject({ method: 'PUT', url: `/api/v1/admin/categorias/${category.idCategoria}`, headers: h, payload: { ...payload, nombre } })));
      expect(results.map((result) => result.statusCode).sort()).toEqual([200, 409]);
    });
    it('protege semántica de categorías con tickets y permite renombrar', async () => {
      const login = await authenticated(app); const auth = await createAuthService(database, env.CSRF_SECRET); const context = await auth.load(login.rawToken, new Date());
      const category = await service.detail(context, 1);
      expect((await edit(category, { requiereActivo: !category.requiereActivo })).statusCode).toBe(409);
      expect((await edit(category, { tipoAplicable: 'AMBOS' })).statusCode).toBe(409);
      const response = await edit(category, { nombre: category.nombre + ' verificada' }); expect(response.statusCode).toBe(200);
      expect((await edit(categorySchema.parse(response.json()), { nombre: category.nombre })).statusCode).toBe(200);
    });
    it('la categoría nueva impone tipo/activo en el alta y la inactiva conserva historia', async () => {
      const category = await create(input({ tipoAplicable: 'INCIDENTE', requiereActivo: true })); const login = await authenticated(app, 'ana.managua');
      const h = { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken };
      const payload = { titulo: 'Prueba de categoría administrada', descripcion: 'Falla ficticia con activo requerido por categoría.', tipo: 'INCIDENTE', idCategoria: category.idCategoria,
        impacto: 'BAJO', urgencia: 'BAJA', idActivo: null, idSolicitante: 2, canalIngreso: 'PORTAL' };
      expect((await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: h, payload })).statusCode).toBe(400);
      expect((await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: h, payload: { ...payload, tipo: 'SOLICITUD', idActivo: 1 } })).statusCode).toBe(400);
      const ticket = await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: h, payload: { ...payload, idActivo: 1 } }); expect(ticket.statusCode, ticket.body).toBe(201);
      expect((await edit(category, { activa: false })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/v1/tickets', headers: h, payload: { ...payload, idActivo: 1 } })).statusCode).toBe(400);
      expect((await app.inject({ url: `/api/v1/tickets/${ticket.json().numero}`, headers: h })).statusCode).toBe(200);
    });
    it('revierte la categoría si falla su evidencia en la misma transacción', async () => {
      const login = await authenticated(app); const auth = await createAuthService(database, env.CSRF_SECRET); const context = await auth.load(login.rawToken, new Date());
      const repository = createCatalogRepository(database);
      const failing = buildCatalogService({ ...repository, atomic: (action) => repository.atomic((repo) => action({ ...repo,
        audit: async () => { throw new Error('Evidencia indisponible'); } })) });
      const data = input(); await expect(failing.create(context, data)).rejects.toThrow('Evidencia indisponible');
      expect(await database.selectFrom('categorias').select('idCategoria').where('nombre', '=', data.nombre).execute()).toEqual([]);
    });
  });
}
