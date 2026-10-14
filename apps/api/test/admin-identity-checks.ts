import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { verify } from 'argon2';
import { adminUserSchema, roleLinksSchema, userCreateSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createUsersService, registerUsersRoutes } from '../src/modules/users/index.js';
import { createRbacService, registerRbacRoutes } from '../src/modules/rbac/index.js';
import { createGroupsService, registerGroupsRoutes } from '../src/modules/groups/index.js';
import { authenticated, submitLogin } from './auth-http.js';

let sequence = 0;
const password = 'IdentidadDemo!2026';
function input(idSede = 1) {
  const username = `identity.demo.${++sequence}`;
  return userCreateSchema.parse({ username, password, nombreCompleto: 'Identidad de prueba', correo: `${username}@example.invalid`,
    idSede, idDepartamento: idSede, idJefeInmediato: null, cargo: null, extension: null });
}

export function adminIdentityChecks(database: Database, env: Env) {
  describe('Administración local: usuarios, roles y grupos', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null }).where('username', '=', 'admin.emergencia').execute();
      const auth = await createAuthService(database, env.CSRF_SECRET);
      app = await buildApp(env, async () => true, auth);
      registerUsersRoutes(app, createUsersService(database)); registerRbacRoutes(app, createRbacService(database)); registerGroupsRoutes(app, createGroupsService(database));
    });
    afterEach(async () => { await app.close(); });
    const adminHeaders = async () => { const login = await authenticated(app); return { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }; };
    const createUser = async () => {
      const headers = await adminHeaders(); const profile = input();
      const response = await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios', headers, payload: profile });
      expect(response.statusCode).toBe(201); return { user: adminUserSchema.parse(response.json()), profile, headers };
    };
    it('deniega sin sesión, a solicitantes y a auditores, y todas las rutas declaran permiso', async () => {
      expect((await app.inject('/api/v1/admin/usuarios')).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const login = await authenticated(app, username);
        expect((await app.inject({ url: '/api/v1/admin/usuarios', headers: { cookie: login.cookie } })).statusCode).toBe(403);
        expect((await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios', payload: input(),
          headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } })).statusCode).toBe(403);
      }
      expect(app.accessRoutes.filter((route) => route.url.startsWith('/api/v1/admin/')).every((route) => route.permiso && !route.publica)).toBe(true);
    });
    it('crea Argon2 local, rechaza inyección de roles y evidencia sanitizada', async () => {
      const { user, profile, headers } = await createUser();
      const stored = await database.selectFrom('usuarios').select(['passwordHash', 'origenCuenta']).where('idUsuario', '=', user.idUsuario).executeTakeFirstOrThrow();
      expect(stored.origenCuenta).toBe('LOCAL'); expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect(await verify(stored.passwordHash ?? '', password)).toBe(true);
      const audit = await database.selectFrom('auditoriaSistema').select('detalle').where('entidad', '=', 'usuarios').where('idEntidad', '=', String(user.idUsuario)).execute();
      expect(JSON.stringify(audit)).not.toMatch(/password|token|correo|example.invalid/);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios', headers, payload: { ...profile, username: 'injected.demo', roles: [4] } })).statusCode).toBe(400);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios', headers: { cookie: headers.cookie }, payload: input() })).statusCode).toBe(403);
    });
    it('rechaza referencias de otras sedes y autoexclusión sin cambios parciales', async () => {
      const { user, profile, headers } = await createUser(); const { username, password: _password, ...edit } = profile;
      void username; void _password;
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}`, headers, payload: { ...edit, idDepartamento: 2 } })).statusCode).toBe(400);
      expect((await database.selectFrom('usuarios').select('idDepartamento').where('idUsuario', '=', user.idUsuario).executeTakeFirstOrThrow()).idDepartamento).toBe(1);
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/usuarios/1/estado', headers, payload: { activo: false } })).statusCode).toBe(409);
    });
    it('asigna roles vigentes, evita duplicados y revoca sesiones al resetear/desactivar', async () => {
      const { user, profile, headers } = await createUser();
      const role = { idRol: 1, idSedeAlcance: 1, vigenteDesde: '2020-01-01', vigenteHasta: null };
      const assignment = await app.inject({ method: 'POST', url: `/api/v1/admin/usuarios/${user.idUsuario}/roles`, headers, payload: role });
      expect(assignment.statusCode).toBe(201); expect(roleLinksSchema.parse(assignment.json())).toHaveLength(1);
      expect((await app.inject({ method: 'POST', url: `/api/v1/admin/usuarios/${user.idUsuario}/roles`, headers, payload: role })).statusCode).toBe(409);
      const link = roleLinksSchema.parse(assignment.json())[0]; if (!link) throw new Error('Falta asignación.');
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}/roles/${link.idUsuarioRol}`, headers,
        payload: { ...role, vigenteHasta: '2099-12-31' } })).statusCode).toBe(200);
      const login = await submitLogin(app, profile.username, password); expect(login.statusCode).toBe(200);
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}/password`, headers, payload: { password: 'OtraClaveDemo!2026' } })).statusCode).toBe(200);
      const sessions = await database.selectFrom('sesiones').select('revocadaEn').where('idUsuario', '=', user.idUsuario).execute();
      expect(sessions.length).toBeGreaterThan(0); expect(sessions.every((s) => s.revocadaEn !== null)).toBe(true);
      await database.updateTable('usuarios').set({ intentosFallidos: 5, bloqueadoHasta: new Date(Date.now() + 60_000) }).where('idUsuario', '=', user.idUsuario).execute();
      expect((await app.inject({ method: 'POST', url: `/api/v1/admin/usuarios/${user.idUsuario}/desbloquear`, headers })).statusCode).toBe(200);
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}/estado`, headers, payload: { activo: false } })).statusCode).toBe(200);
    });
    it('gestiona grupos, vigencias, coordinadores y especialidades; deniega miembro de otra sede', async () => {
      const { user, headers } = await createUser();
      const group = await app.inject({ method: 'POST', url: '/api/v1/admin/grupos', headers,
        payload: { nombre: 'Grupo de prueba', nivel: 2, idSede: 1, correoGrupo: null, activo: true } });
      expect(group.statusCode).toBe(201); const { idGrupo } = group.json<{ idGrupo: number }>();
      const membership = { idUsuario: user.idUsuario, esCoordinador: true, desde: '2020-01-01', hasta: null };
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/grupos/${idGrupo}/miembros`, headers, payload: membership })).statusCode).toBe(200);
      const { username, password: _password, ...profile } = input(2); void username; void _password;
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}`, headers, payload: profile })).statusCode).toBe(409);
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/grupos/${idGrupo}/miembros`, headers, payload: { ...membership, idUsuario: 3 } })).statusCode).toBe(400);
      expect((await app.inject({ method: 'PUT', url: `/api/v1/admin/usuarios/${user.idUsuario}/especialidades`, headers, payload: { idCategoria: 1, nivelDominio: 2 } })).statusCode).toBe(200);
      expect((await app.inject({ method: 'DELETE', url: `/api/v1/admin/usuarios/${user.idUsuario}/especialidades/1`, headers })).statusCode).toBe(200);
      expect((await app.inject({ method: 'DELETE', url: `/api/v1/admin/grupos/${idGrupo}/miembros/${user.idUsuario}`, headers })).statusCode).toBe(200);
    });
    it('un rol de administración limitado por sede no puede ampliar alcance ni administrar accesos globales', async () => {
      const { user, profile, headers } = await createUser();
      const { idRol } = await database.insertInto('roles').values({ codigo: `TEST_ADMIN_SEDE_${user.idUsuario}`, nombre: 'Admin de sede para prueba', esSistema: false })
        .returning('idRol').executeTakeFirstOrThrow();
      const permissions = await database.selectFrom('permisos').select('idPermiso').where('codigo', 'in', ['auth.sesion', 'usuario.administrar', 'rol.administrar']).execute();
      await database.insertInto('rolPermiso').values(permissions.map((p) => ({ idRol, idPermiso: p.idPermiso }))).execute();
      await database.insertInto('usuarioRol').values({ idRol, idUsuario: user.idUsuario, idSedeAlcance: 1, vigenteDesde: '2020-01-01', asignadoPor: 1 }).execute();
      const login = await submitLogin(app, profile.username, password); expect(login.statusCode).toBe(200);
      const cookie = login.cookies.find((c) => c.name === 'helpdesk_sid'); if (!cookie) throw new Error('Falta cookie.');
      const session = login.json<{ csrfToken: string }>(); const scopedHeaders = { cookie: `helpdesk_sid=${cookie.value}`, 'x-csrf-token': session.csrfToken };
      expect((await app.inject({ url: '/api/v1/admin/usuarios/3', headers: scopedHeaders })).statusCode).toBe(403);
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/usuarios/1/password', headers: scopedHeaders, payload: { password } })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/grupos', headers: scopedHeaders,
        payload: { nombre: 'Global prohibido', nivel: 1, idSede: null, correoGrupo: null, activo: true } })).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/api/v1/admin/usuarios/2/roles', headers: scopedHeaders,
        payload: { idRol: 4, idSedeAlcance: 1, vigenteDesde: '2020-01-01', vigenteHasta: null } })).statusCode).toBe(403);
      expect((await app.inject({ url: '/api/v1/admin/usuarios?pageSize=100', headers: scopedHeaders })).json<{ data: { idSede: number }[] }>().data.every((u) => u.idSede === 1)).toBe(true);
      expect((await app.inject({ method: 'DELETE', url: `/api/v1/admin/usuarios/${user.idUsuario}/roles/99999`, headers })).statusCode).toBe(404);
    });
    it('protege el último administrador global aun cuando otro operador administra roles', async () => {
      const { user, profile } = await createUser();
      const { idRol } = await database.insertInto('roles').values({ codigo: `TEST_OPERADOR_${user.idUsuario}`, nombre: 'Operador de roles para prueba', esSistema: false })
        .returning('idRol').executeTakeFirstOrThrow();
      const permissions = await database.selectFrom('permisos').select('idPermiso').where('codigo', 'in', ['auth.sesion', 'rol.administrar']).execute();
      await database.insertInto('rolPermiso').values(permissions.map((p) => ({ idRol, idPermiso: p.idPermiso }))).execute();
      await database.insertInto('usuarioRol').values({ idRol, idUsuario: user.idUsuario, idSedeAlcance: null, vigenteDesde: '2020-01-01', asignadoPor: 1 }).execute();
      const login = await submitLogin(app, profile.username, password); expect(login.statusCode).toBe(200);
      const cookie = login.cookies.find((c) => c.name === 'helpdesk_sid'); if (!cookie) throw new Error('Falta cookie.');
      const assignment = await database.selectFrom('usuarioRol').select('idUsuarioRol').where('idUsuario', '=', 1).where('idRol', '=', 4).executeTakeFirstOrThrow();
      const before = await database.selectFrom('auditoriaSistema').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      const response = await app.inject({ method: 'DELETE', url: `/api/v1/admin/usuarios/1/roles/${assignment.idUsuarioRol}`,
        headers: { cookie: `helpdesk_sid=${cookie.value}`, 'x-csrf-token': login.json<{ csrfToken: string }>().csrfToken } });
      expect(response.statusCode).toBe(409);
      expect(await database.selectFrom('usuarioRol').select('idUsuarioRol').where('idUsuarioRol', '=', assignment.idUsuarioRol).executeTakeFirst()).toBeDefined();
      expect((await database.selectFrom('auditoriaSistema').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow()).total).toBe(before.total);
    });
  });
}
