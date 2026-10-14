import { slaSettingsSchema, slaPriorityParamsSchema, slaPriorityUpdateSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { SlaSettingsService } from './sla.service.js';

export function registerSlaSettingsRoutes(app: FastifyInstance, service: SlaSettingsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'parametro.administrar' as const };
  routes.get('/api/v1/admin/sla', { config, schema: { response: { 200: slaSettingsSchema } } }, (request) => service.list(request.sesion));
  routes.put('/api/v1/admin/sla/prioridades/:codigo', { config, schema: { params: slaPriorityParamsSchema, body: slaPriorityUpdateSchema,
    response: { 200: slaSettingsSchema } } }, (request) => service.edit(request.sesion, request.params.codigo, request.body));
}
