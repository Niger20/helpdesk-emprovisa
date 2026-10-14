import { categoryCatalogSchema, categoryInputSchema, categoryListSchema, categoryParamsSchema, categoryQuerySchema, categorySchema, categoryUpdateSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { CatalogService } from './catalog.service.js';

export function registerCatalogRoutes(app: FastifyInstance, service: CatalogService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'parametro.administrar' as const };
  routes.get('/api/v1/admin/categorias/catalogos', { config, schema: { response: { 200: categoryCatalogSchema } } }, (request) => service.catalogs(request.sesion));
  routes.get('/api/v1/admin/categorias', { config, schema: { querystring: categoryQuerySchema, response: { 200: categoryListSchema } } }, (request) => service.list(request.sesion, request.query));
  routes.post('/api/v1/admin/categorias', { config, schema: { body: categoryInputSchema, response: { 201: categorySchema } } },
    async (request, reply) => { const data = await service.create(request.sesion, request.body); reply.code(201); return data; });
  routes.put('/api/v1/admin/categorias/:idCategoria', { config, schema: { params: categoryParamsSchema, body: categoryUpdateSchema, response: { 200: categorySchema } } },
    (request) => service.edit(request.sesion, request.params.idCategoria, request.body));
}
