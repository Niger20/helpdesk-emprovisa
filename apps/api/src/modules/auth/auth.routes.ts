import { csrfResponseSchema, loginRequestSchema, logoutResponseSchema, sesionResponseSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { newLoginChallenge } from '../../common/crypto/session-tokens.js';
import { cookieOptions, loginCookie, sessionCookie, setSessionCookie } from '../../common/http/auth-cookies.js';
import type { AuthService } from './auth.service.js';
import { AppError } from '../../common/errors/app-error.js';

export function registerAuthRoutes(app: FastifyInstance, auth: AuthService, secret: string) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/auth/csrf', { config: { publica: true }, schema: { response: { 200: csrfResponseSchema } } }, async (_request, reply) => {
    const challenge = newLoginChallenge(secret);
    reply.header('Cache-Control', 'no-store').setCookie(loginCookie, challenge.cookie, { ...cookieOptions, maxAge: 300 });
    return { csrfToken: challenge.csrfToken };
  });
  routes.post('/api/v1/auth/login', {
    config: { publica: true, rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { body: loginRequestSchema, response: { 200: sesionResponseSchema } },
  }, async (request, reply) => {
    const session = await auth.login(request.body, { direccionIp: request.ip, userAgent: request.headers['user-agent'] }, new Date())
      .catch((error: unknown) => {
        request.loginAttemptRecorded = error instanceof AppError
          && ['CREDENCIALES_INVALIDAS', 'LIMITE_EXCEDIDO'].includes(error.code);
        throw error;
      });
    request.loginAttemptRecorded = true;
    setSessionCookie(reply, session.token, session.context);
    reply.clearCookie(loginCookie, cookieOptions).header('Cache-Control', 'no-store');
    return { usuario: session.context.usuario, csrfToken: session.context.csrfToken, expiraEn: session.context.expiraEn.toISOString() };
  });
  routes.get('/api/v1/auth/me', { config: { permiso: 'auth.sesion' }, schema: { response: { 200: sesionResponseSchema } } }, async (request, reply) => {
    const session = auth.me(request.sesion);
    reply.header('Cache-Control', 'no-store');
    if (!session) throw new Error('La sesión no está disponible.');
    return { usuario: session.usuario, csrfToken: session.csrfToken, expiraEn: session.expiraEn.toISOString() };
  });
  routes.post('/api/v1/auth/logout', { config: { permiso: 'auth.sesion' }, schema: { response: { 200: logoutResponseSchema } } }, async (request, reply) => {
    await auth.logout(request.sesion, new Date());
    reply.clearCookie(sessionCookie, cookieOptions).header('Cache-Control', 'no-store');
    return { mensaje: 'Sesión cerrada.' as const };
  });
}
