import type { FastifyInstance } from 'fastify';
import { csrfResponseSchema, sesionResponseSchema } from '@helpdesk/contracts';
import { sessionCookie, loginCookie } from '../src/common/http/auth-cookies.js';
import { demoPassword, demoUsername } from '../src/infra/db/seeds/context.js';

export async function submitLogin(app: FastifyInstance, username = demoUsername, password = demoPassword) {
  const challenge = await app.inject('/api/v1/auth/csrf');
  const cookie = challenge.cookies.find((item) => item.name === loginCookie);
  if (!cookie) throw new Error('No se emitió el desafío de login.');
  return app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: {
    cookie: `${loginCookie}=${cookie.value}`, 'x-csrf-token': csrfResponseSchema.parse(challenge.json()).csrfToken,
  }, payload: { username, password } });
}

export async function authenticated(app: FastifyInstance, username = demoUsername) {
  const response = await submitLogin(app, username);
  if (response.statusCode !== 200) throw new Error('Falló la autenticación de prueba.');
  const cookie = response.cookies.find((item) => item.name === sessionCookie);
  if (!cookie) throw new Error('No se emitió cookie de sesión.');
  return { cookie: `${sessionCookie}=${cookie.value}`, rawToken: cookie.value,
    session: sesionResponseSchema.parse(response.json()), response };
}
