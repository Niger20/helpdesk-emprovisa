import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { sesionResponseSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildApp } from '../src/app.js';
import { tokenHash } from '../src/common/crypto/session-tokens.js';
import { authenticated, submitLogin } from './auth-http.js';
import { demoPassword } from '../src/infra/db/seeds/context.js';
import { authSecurityChecks } from './auth-security-checks.js';

export function authChecks(database: Database, env: Env) {
  describe('Autenticación local, sesión y permisos', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' }).execute();
      const auth = await createAuthService(database, env.CSRF_SECRET);
      app = await buildApp(env, async () => true, auth);
      app.get('/api/v1/prueba/admin', { config: { permiso: 'usuario.administrar' } }, async () => ({ permitido: true }));
      app.get('/api/v1/prueba/sede', { config: { permiso: 'ticket.ver' } }, async (request) => {
        auth.assertPermission(request.sesion, 'ticket.ver', 1);
        return { permitido: true };
      });
    });
    afterEach(async () => { await app.close(); });
    it('autentica, emite cookie HttpOnly y almacena únicamente SHA-256', async () => {
      const login = await authenticated(app);
      expect(login.response.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('HttpOnly')]));
      expect(login.response.body).not.toContain(login.rawToken);
      const row = await database.selectFrom('sesiones').selectAll().where('tokenHash', '=', tokenHash(login.rawToken)).executeTakeFirstOrThrow();
      expect(row.tokenHash).not.toBe(login.rawToken);
      expect(row.expiraEn.getTime() - row.ultimaActividad.getTime()).toBe(30 * 60_000);
      const attempts = await database.selectFrom('intentosLogin').selectAll().execute();
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.exitoso).toBe(true);
      const me = await app.inject({ url: '/api/v1/auth/me', headers: { cookie: login.cookie } });
      expect(me.statusCode).toBe(200);
      expect(sesionResponseSchema.parse(me.json()).usuario.username).toBe('admin.emergencia');
      expect(me.body).not.toMatch(/passwordHash|tokenHash|guidDirectorio|correo/);
    });
    it('los cinco fallos bloquean la cuenta y una clave correcta no salta el bloqueo', async () => {
      for (let i = 0; i < 5; i++) expect((await submitLogin(app, 'ana.managua', 'incorrecta')).statusCode).toBe(401);
      expect((await submitLogin(app, 'ana.managua')).statusCode).toBe(401);
      const user = await database.selectFrom('usuarios').selectAll().where('username', '=', 'ana.managua').executeTakeFirstOrThrow();
      expect(user.intentosFallidos).toBe(5);
      expect(user.bloqueadoHasta?.getTime()).toBeGreaterThan(Date.now());
      expect(await database.selectFrom('intentosLogin').selectAll().execute()).toHaveLength(6);
    });
    it('los fallos concurrentes tampoco permiten superar el umbral', async () => {
      const results = await Promise.all(Array.from({ length: 6 }, () => submitLogin(app, 'ana.managua', 'incorrecta')));
      expect(results.every((result) => result.statusCode === 401)).toBe(true);
      const user = await database.selectFrom('usuarios').select('intentosFallidos').where('username', '=', 'ana.managua').executeTakeFirstOrThrow();
      expect(user.intentosFallidos).toBe(5);
    });
    it('restablece fallos después del bloqueo vencido y del login correcto', async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 5, bloqueadoHasta: new Date(Date.now() - 1000) }).where('username', '=', 'ana.managua').execute();
      expect((await submitLogin(app, 'ana.managua')).statusCode).toBe(200);
      const user = await database.selectFrom('usuarios').select('intentosFallidos').where('username', '=', 'ana.managua').executeTakeFirstOrThrow();
      expect(user.intentosFallidos).toBe(0);
    });
    it('deniega una cuenta inactiva aunque la contraseña coincida', async () => {
      await database.updateTable('usuarios').set({ estado: 'INACTIVO' }).where('username', '=', 'ana.managua').execute();
      expect((await submitLogin(app, 'ana.managua')).statusCode).toBe(401);
    });
    it('aplica límites por usuario para nombres que no existen', async () => {
      for (let i = 0; i < 10; i++) expect((await submitLogin(app, 'desconocido', demoPassword)).statusCode).toBe(401);
      expect((await submitLogin(app, 'desconocido', demoPassword)).statusCode).toBe(429);
      expect(await database.selectFrom('intentosLogin').selectAll().execute()).toHaveLength(11);
    });
    it('limita también por IP aunque cambie el nombre de usuario', async () => {
      for (let i = 0; i < 20; i++) expect((await submitLogin(app, `desconocido.${i}`, demoPassword)).statusCode).toBe(401);
      expect((await submitLogin(app, 'desconocido.final', demoPassword)).statusCode).toBe(429);
      expect(await database.selectFrom('intentosLogin').selectAll().execute()).toHaveLength(21);
    });
    it('autoriza al jefe y deniega al solicitante para administrar', async () => {
      const admin = await authenticated(app);
      expect((await app.inject({ url: '/api/v1/prueba/admin', headers: { cookie: admin.cookie } })).statusCode).toBe(200);
      const user = await authenticated(app, 'ana.managua');
      expect((await app.inject({ url: '/api/v1/prueba/admin', headers: { cookie: user.cookie } })).statusCode).toBe(403);
    });
    it('autoriza la sede asignada y deniega una sede ajena', async () => {
      const managua = await authenticated(app, 'analista.managua');
      expect((await app.inject({ url: '/api/v1/prueba/sede', headers: { cookie: managua.cookie } })).statusCode).toBe(200);
      const rivas = await authenticated(app, 'analista.rivas');
      expect((await app.inject({ url: '/api/v1/prueba/sede', headers: { cookie: rivas.cookie } })).statusCode).toBe(403);
    });
    authSecurityChecks(() => app, database);
  });
}
