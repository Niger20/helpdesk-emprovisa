import type { FastifyInstance } from 'fastify';
import { expect, it } from 'vitest';
import type { Database } from '../src/infra/db/client.js';
import { authenticated } from './auth-http.js';
import { tokenHash } from '../src/common/crypto/session-tokens.js';

export function authSecurityChecks(getApp: () => FastifyInstance, database: Database) {
  it('exige CSRF en login y registra el intento rechazado', async () => {
    const app = getApp();
    const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username: 'ana.managua', password: 'incorrecta' } });
    expect(response.statusCode).toBe(403);
    const attempts = await database.selectFrom('intentosLogin').selectAll().execute();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.motivoFallo).toBe('HTTP_403');
  });
  it('exige CSRF por sesión para logout, luego revoca la cookie', async () => {
    const app = getApp();
    const login = await authenticated(app);
    const missing = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: login.cookie } });
    expect(missing.statusCode).toBe(403);
    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } });
    expect(logout.statusCode).toBe(200);
    expect((await app.inject({ url: '/api/v1/auth/me', headers: { cookie: login.cookie } })).statusCode).toBe(401);
  });
  it('un token CSRF de otra sesión no autoriza cambios', async () => {
    const app = getApp();
    const first = await authenticated(app);
    const second = await authenticated(app);
    expect((await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: first.cookie, 'x-csrf-token': second.session.csrfToken } })).statusCode).toBe(403);
  });
  it('rechaza sesiones expiradas y sesiones de usuarios desactivados', async () => {
    const app = getApp();
    const login = await authenticated(app);
    await database.updateTable('sesiones').set({ expiraEn: new Date(Date.now() - 1000) }).where('tokenHash', '=', tokenHash(login.rawToken)).execute();
    expect((await app.inject({ url: '/api/v1/auth/me', headers: { cookie: login.cookie } })).statusCode).toBe(401);
    const second = await authenticated(app, 'ana.managua');
    await database.updateTable('usuarios').set({ estado: 'INACTIVO' }).where('username', '=', 'ana.managua').execute();
    expect((await app.inject({ url: '/api/v1/auth/me', headers: { cookie: second.cookie } })).statusCode).toBe(401);
  });
  it('desconoce cookies manipuladas y no recupera hashes del cliente', async () => {
    const app = getApp();
    expect((await app.inject({ url: '/api/v1/auth/me', headers: { cookie: 'helpdesk_sid=inventada' } })).statusCode).toBe(401);
    const login = await authenticated(app);
    expect((await app.inject({ url: '/api/v1/auth/me', headers: { cookie: `helpdesk_sid=${tokenHash(login.rawToken)}` } })).statusCode).toBe(401);
  });
}
