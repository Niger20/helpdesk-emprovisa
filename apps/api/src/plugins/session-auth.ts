import fp from 'fastify-plugin';
import type { AuthService, SessionContext } from '../modules/auth/index.js';
import { cookieOptions, sessionCookie, setSessionCookie } from '../common/http/auth-cookies.js';

declare module 'fastify' {
  interface FastifyRequest { sesion: SessionContext | null; loginAttemptRecorded: boolean }
}

export const sessionAuthPlugin = fp<{ auth?: AuthService }>(async (app, options) => {
  app.decorateRequest('sesion', null);
  app.decorateRequest('loginAttemptRecorded', false);
  app.addHook('onRequest', async (request, reply) => {
    const token = request.cookies[sessionCookie];
    if (!token || !options.auth || request.routeOptions.config.publica || request.is404) return;
    request.sesion = await options.auth.load(token, new Date());
    if (request.sesion) request.sesion = { ...request.sesion, direccionIp: request.ip };
    if (request.sesion) setSessionCookie(reply, token, request.sesion);
    else reply.clearCookie(sessionCookie, cookieOptions);
  });
}, { name: 'session-auth' });
