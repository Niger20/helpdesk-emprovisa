import fp from 'fastify-plugin';
import type { AuthService } from '../modules/auth/index.js';

export const loginAttemptsPlugin = fp<{ auth: AuthService }>(async (app, options) => {
  app.addHook('onSend', async (request, reply, payload) => {
    if (request.method !== 'POST' || request.routeOptions.url !== '/api/v1/auth/login' || request.loginAttemptRecorded) return payload;
    request.loginAttemptRecorded = true;
    const body: unknown = request.body;
    const username = body && typeof body === 'object' && 'username' in body && typeof body.username === 'string'
      ? body.username.trim().toLowerCase() : '<invalido>';
    await options.auth.recordRejectedAttempt(username, `HTTP_${reply.statusCode}`, {
      direccionIp: request.ip, userAgent: request.headers['user-agent'],
    }, new Date());
    return payload;
  });
}, { name: 'login-attempts' });
