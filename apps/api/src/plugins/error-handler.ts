import { problemSchema } from '@helpdesk/contracts';
import type { ErrorCode } from '@helpdesk/contracts';
import { AppError } from '../common/errors/app-error.js';
import fp from 'fastify-plugin';

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const status = error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode : 500;
    const code: ErrorCode = error instanceof AppError ? error.code : status === 400 ? 'ENTRADA_INVALIDA'
      : status === 429 ? 'LIMITE_EXCEDIDO' : status === 403 ? 'NO_AUTORIZADO' : 'ERROR_INTERNO';
    if (status >= 500) app.log.error({ requestId: request.id }, 'Error interno de la petición');
    void reply.code(status).type('application/problem+json').send(problemSchema.parse({
      type: 'about:blank', title: status === 429 ? 'Demasiadas solicitudes' : 'No se pudo completar la solicitud',
      status, code, detail: error instanceof AppError ? error.message : 'Intentá nuevamente.', instance: request.url.split('?')[0],
    }));
  });
  app.setNotFoundHandler((request, reply) => {
    void reply.code(404).type('application/problem+json').send({
      type: 'about:blank', title: 'Ruta no encontrada', status: 404,
      code: 'RUTA_NO_ENCONTRADA', detail: 'El recurso solicitado no existe.', instance: request.url.split('?')[0],
    });
  });
}, { name: 'error-handler' });
