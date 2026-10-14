import fp from 'fastify-plugin';
import { validLoginChallenge, tokensEqual, csrfToken } from '../common/crypto/session-tokens.js';
import { surveyTokenSchema } from '@helpdesk/contracts';
import { loginCookie } from '../common/http/auth-cookies.js';
import { AppError } from '../common/errors/app-error.js';

export const csrfPlugin = fp<{ secret: string }>(async (app, options) => {
  app.addHook('preValidation', async (request) => {
    if (request.is404 || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
    const header = request.headers['x-csrf-token'];
    if (request.routeOptions.url === '/api/v1/encuestas/actual' && request.method === 'POST') {
      const parsed = surveyTokenSchema.safeParse(request.headers['x-survey-token']);
      if (!parsed.success || !tokensEqual(csrfToken(options.secret, `survey:${parsed.data}`), header)) throw new AppError('CSRF_INVALIDO', 403, 'Recargá la encuesta antes de responder.');
      return;
    }
    const valid = request.routeOptions.url === '/api/v1/auth/login'
      ? validLoginChallenge(options.secret, request.cookies[loginCookie], header)
      : request.sesion && tokensEqual(request.sesion.csrfToken, header);
    if (!valid) throw new AppError('CSRF_INVALIDO', 403, 'La verificación de seguridad expiró. Recargá la página e intentá nuevamente.');
  });
}, { name: 'csrf' });
