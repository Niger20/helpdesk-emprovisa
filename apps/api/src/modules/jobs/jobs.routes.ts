import type { FastifyInstance } from 'fastify';
import { automationStatusSchema } from '@helpdesk/contracts';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { JobsService } from './index.js';

export function registerJobsRoutes(app: FastifyInstance, service: JobsService) {
  app.withTypeProvider<ZodTypeProvider>().get('/api/v1/tareas', { config: { permiso: 'auditoria.ver' },
    schema: { response: { 200: automationStatusSchema } } }, (request) => service.status(request.sesion));
}
