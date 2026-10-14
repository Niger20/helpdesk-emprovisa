import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { roleCatalogSchema, roleCatalogRoleSchema, sesionResponseSchema } from '@helpdesk/contracts';
import type { RoleCatalogInput, RoleCatalogRole } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createUsersService, registerUsersRoutes } from '../src/modules/users/index.js';
import { createRoleCatalogService, registerRoleCatalogRoutes } from '../src/modules/rbac/role-catalog/index.js';
import { authenticated, submitLogin } from './auth-http.js';

let sequence = 0;
const path = '/api/v1/admin/catalogo-roles';
const password = 'CatalogoRoles!2026';
const data = (): RoleCatalogInput => ({ codigo: `CUSTOM_TEST_${++sequence}`, nombre: 'Rol personalizado de prueba',
  descripcion: 'Descripción ficticia', permisos: ['auth.sesion', 'ticket.ver_propios', 'ticket.crear'] });
const update = (role: RoleCatalogRole, datos: RoleCatalogInput) => ({ datos,
  anterior: { codigo: role.codigo, nombre: role.nombre, descripcion: role.descripcion, permisos: role.permisos } });

export function roleCatalogChecks(database: Database, env: Env) {
  describe('RF-18: catálogo de roles personalizados y permisos', () => {
    let app: FastifyInstance;
    let roleIds: number[];
    let userIds: number[];
    beforeEach(async () => {
      roleIds = []; userIds = [];
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null })
        .where('username', 'in', ['admin.emergencia', 'ana.managua', 'auditor.demo']).execute();
      const auth = await createAuthService(database, env.CSRF_SECRET);
      app = await buildApp(env, async () => true, auth);
      registerUsersRoutes(app, createUsersService(database));
      registerRoleCatalogRoutes(app, createRoleCatalogService(database));
    });
    afterEach(async () => {
      if (roleIds.length) {
        await database.deleteFrom('usuarioRol').where('idRol', 'in', roleIds).execute();
        await database.deleteFrom('rolPermiso').where('idRol', 'in', roleIds).execute();
        await database.deleteFrom('roles').where('idRol', 'in', roleIds).execute();
      }
      if (userIds.length) await database.updateTable('usuarios').set({ estado: 'INACTIVO' }).where('idUsuario', 'in', userIds).execute();
      await app.close();
    });
    const headers = async () => { const login = await authenticated(app); return { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }; };
    const create = async (payload = data()) => {
      const response = await app.inject({ method: 'POST', url: path, headers: await headers(), payload });
      expect(response.statusCode).toBe(201);
      const role = roleCatalogRoleSchema.parse(response.json()); roleIds.push(role.idRol); return role;
    };
    const user = async () => {
      const username = `role.catalog.${++sequence}`;
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios', headers: await headers(),
        payload: { username, password, nombreCompleto: 'Catálogo prueba', correo: `${username}@example.invalid`,
          idSede: 1, idDepartamento: null, idJefeInmediato: null, cargo: null, extension: null } });
      expect(response.statusCode).toBe(201); const idUsuario = response.json<{ idUsuario: number }>().idUsuario;
      userIds.push(idUsuario); return { idUsuario, username };
    };
    const bind = async (idRol: number, idUsuario: number, scope: number | null = null, desde = '2020-01-01') => {
      await database.insertInto('usuarioRol').values({ idRol, idUsuario, idSedeAlcance: scope, vigenteDesde: desde, asignadoPor: 1 }).execute();
    };
    const loginHeaders = async (username: string) => {
      const response = await submitLogin(app, username, password); expect(response.statusCode).toBe(200);
      const cookie = response.cookies.find((item) => item.name === 'helpdesk_sid'); if (!cookie) throw new Error('Falta cookie.');
      return { cookie: `helpdesk_sid=${cookie.value}`, 'x-csrf-token': sesionResponseSchema.parse(response.json()).csrfToken };
    };
    it('deniega sin sesión, solicitante, auditor y CSRF ausente; declara permisos', async () => {
      expect((await app.inject(path)).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const login = await authenticated(app, username);
        expect((await app.inject({ url: path, headers: { cookie: login.cookie } })).statusCode).toBe(403);
        expect((await app.inject({ method: 'POST', url: path, headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: data() })).statusCode).toBe(403);
      }
      const admin = await headers();
      expect((await app.inject({ method: 'POST', url: path, headers: { cookie: admin.cookie }, payload: data() })).statusCode).toBe(403);
      expect(app.accessRoutes.filter((route) => route.url.startsWith(path)).every((route) => route.permiso === 'rol.administrar' && !route.publica)).toBe(true);
    });
    it('consulta permisos existentes y conserva todos los roles de sistema inmutables', async () => {
      const admin = await headers(); const response = await app.inject({ url: path, headers: admin });
      expect(response.statusCode).toBe(200); const catalog = roleCatalogSchema.parse(response.json());
      expect(catalog.permisos.length).toBeGreaterThan(0);
      for (const role of catalog.roles.filter((item) => item.esSistema)) {
        expect((await app.inject({ method: 'PUT', url: `${path}/${role.idRol}`, headers: admin,
          payload: update(role, data()) })).statusCode).toBe(403);
      }
      const invalid = { ...data(), codigo: 'AUDITOR' };
      expect((await app.inject({ method: 'POST', url: path, headers: admin, payload: invalid })).statusCode).toBe(400);
      expect((await app.inject({ method: 'POST', url: path, headers: admin, payload: { ...data(), permisos: ['ticket.crear'] } })).statusCode).toBe(400);
      expect((await app.inject({ method: 'POST', url: path, headers: admin, payload: { ...data(), permisos: ['auth.sesion', 'inventado.escribir'] } })).statusCode).toBe(400);
    });
    it('permite login personalizado, preserva vínculos y revoca sesiones incluso con asignación futura', async () => {
      const role = await create(); const account = await user(); await bind(role.idRol, account.idUsuario);
      const login = await loginHeaders(account.username);
      const session = await app.inject({ url: '/api/v1/auth/me', headers: login }); expect(session.statusCode).toBe(200);
      expect(sesionResponseSchema.parse(session.json()).usuario.roles.some((item) => item.codigo === role.codigo)).toBe(true);
      const future = await user(); await bind(1, future.idUsuario); await loginHeaders(future.username);
      await bind(role.idRol, future.idUsuario, null, '2099-01-01');
      const result = await app.inject({ method: 'PUT', url: `${path}/${role.idRol}`, headers: await headers(),
        payload: update(role, { ...data(), nombre: 'Nombre modificado', permisos: ['auth.sesion', 'ticket.ver_propios'] }) });
      expect(result.statusCode).toBe(200);
      const sessions = await database.selectFrom('sesiones').select('revocadaEn').where('idUsuario', 'in', [account.idUsuario, future.idUsuario]).execute();
      expect(sessions.length).toBeGreaterThanOrEqual(2); expect(sessions.every((item) => item.revocadaEn !== null)).toBe(true);
      expect(await database.selectFrom('usuarioRol').select('idRol').where('idRol', '=', role.idRol).execute()).toHaveLength(2);
      await database.deleteFrom('usuarioRol').where('idUsuario', '=', future.idUsuario).where('idRol', '=', 1).execute();
    });
    it('rechaza autoedición futura y conflictos de concurrencia sin sobrescribir', async () => {
      const role = await create(); await bind(role.idRol, 1, null, '2099-01-01');
      const admin = await headers();
      expect((await app.inject({ method: 'PUT', url: `${path}/${role.idRol}`, headers: admin, payload: update(role, data()) })).statusCode).toBe(409);
      await database.deleteFrom('usuarioRol').where('idRol', '=', role.idRol).execute();
      const results = await Promise.all(['A', 'B'].map((suffix) => app.inject({ method: 'PUT', url: `${path}/${role.idRol}`, headers: admin,
        payload: update(role, { ...data(), nombre: `Concurrente ${suffix}` }) })));
      expect(results.map((response) => response.statusCode).sort()).toEqual([200, 409]);
      const duplicateInput = data();
      const duplicate = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: path, headers: admin, payload: duplicateInput })));
      for (const response of duplicate) if (response.statusCode === 201) roleIds.push(roleCatalogRoleSchema.parse(response.json()).idRol);
      expect(duplicate.map((response) => response.statusCode).sort()).toEqual([201, 409]);
    });
    it('deniega administración por sede y elevación de permisos globales', async () => {
      const role = await create({ ...data(), permisos: ['auth.sesion', 'rol.administrar'] }); const account = await user();
      await bind(role.idRol, account.idUsuario, 1); let actor = await loginHeaders(account.username);
      expect((await app.inject({ url: path, headers: actor })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: path, headers: actor, payload: data() })).statusCode).toBe(403);
      await database.updateTable('usuarioRol').set({ idSedeAlcance: null }).where('idRol', '=', role.idRol).execute();
      actor = await loginHeaders(account.username);
      expect((await app.inject({ method: 'POST', url: path, headers: actor, payload: { ...data(), permisos: ['auth.sesion', 'rol.administrar', 'usuario.administrar'] } })).statusCode).toBe(403);
      const service = createRoleCatalogService(database);
      await expect(service.create(null, data())).rejects.toMatchObject({ statusCode: 401 });
    });
    it('revalida sesión del actor en service y rechaza asignaciones de sedes incoherentes', async () => {
      const role = await create(); const account = await user(); await bind(role.idRol, account.idUsuario, 2);
      const response = await app.inject({ method: 'PUT', url: `${path}/${role.idRol}`, headers: await headers(), payload: update(role, data()) });
      expect(response.statusCode).toBe(409);
      expect((await database.selectFrom('roles').select('codigo').where('idRol', '=', role.idRol).executeTakeFirstOrThrow()).codigo).toBe(role.codigo);
      const auth = await createAuthService(database, env.CSRF_SECRET); const login = await authenticated(app);
      const context = await auth.load(login.rawToken, new Date()); if (!context) throw new Error('Falta contexto.');
      await database.updateTable('sesiones').set({ revocadaEn: new Date() }).where('idSesion', '=', context.idSesion).execute();
      await expect(createRoleCatalogService(database).create(context, data())).rejects.toMatchObject({ statusCode: 403 });
    });
    it('revierte pérdida del último administrador global y mantiene auditoría/grants', async () => {
      const target = await create({ ...data(), permisos: ['auth.sesion', 'rol.administrar', 'usuario.administrar'] });
      const operator = await create({ ...data(), permisos: ['auth.sesion', 'rol.administrar'] });
      const account = await user(); await bind(operator.idRol, account.idUsuario); await bind(target.idRol, 1);
      const actor = await loginHeaders(account.username);
      const original = await database.selectFrom('usuarioRol').selectAll().where('idUsuario', '=', 1).where('idRol', '=', 4).executeTakeFirstOrThrow();
      await database.deleteFrom('usuarioRol').where('idUsuarioRol', '=', original.idUsuarioRol).execute();
      try {
        const response = await app.inject({ method: 'PUT', url: `${path}/${target.idRol}`, headers: actor,
          payload: update(target, { ...data(), permisos: ['auth.sesion', 'rol.administrar'] }) });
        expect(response.statusCode).toBe(409);
        const grants = await database.selectFrom('rolPermiso as rp').innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso')
          .select('p.codigo').where('rp.idRol', '=', target.idRol).execute();
        expect(grants.some((grant) => grant.codigo === 'usuario.administrar')).toBe(true);
        expect(await database.selectFrom('auditoriaSistema').select('accion').where('entidad', '=', 'roles')
          .where('idEntidad', '=', String(target.idRol)).where('accion', '=', 'ROL_EDITADO').execute()).toHaveLength(0);
      } finally { await database.insertInto('usuarioRol').values(original).execute(); }
    });
  });
}
