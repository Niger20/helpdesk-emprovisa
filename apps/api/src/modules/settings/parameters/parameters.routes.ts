import { parameterListSchema, parameterParamsSchema, parameterSchema, parameterUpdateSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ParametersService } from './parameters.service.js';

export function registerParametersRoutes(app: FastifyInstance, service: ParametersService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'parametro.administrar' as const };
  routes.get('/api/v1/admin/parametros', { config, schema: { response: { 200: parameterListSchema } } }, (request) => service.list(request.sesion));
  routes.put('/api/v1/admin/parametros/:clave', { config, schema: { params: parameterParamsSchema, body: parameterUpdateSchema, response: { 200: parameterSchema } } },
    (request) => service.edit(request.sesion, request.params.clave, request.body));
}
