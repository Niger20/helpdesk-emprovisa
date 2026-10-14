import fp from 'fastify-plugin';
import { validLoginChallenge, tokensEqual } from '../common/crypto/session-tokens.js';
import { loginCookie } from '../common/http/auth-cookies.js';
import { AppError } from '../common/errors/app-error.js';

export const csrfPlugin = fp<{ secret: string }>(async (app, options) => {
  app.addHook('preValidation', async (request) => {
    if (request.is404 || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
    const header = request.headers['x-csrf-token'];
    const valid = request.routeOptions.url === '/api/v1/auth/login'
      ? validLoginChallenge(options.secret, request.cookies[loginCookie], header)
      : request.sesion && tokensEqual(request.sesion.csrfToken, header);
    if (!valid) throw new AppError('CSRF_INVALIDO', 403, 'La verificación de seguridad expiró. Recargá la página e intentá nuevamente.');
  });
}, { name: 'csrf' });
