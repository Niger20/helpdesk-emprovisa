import { adminParamsSchema, roleCatalogSchema, roleCatalogInputSchema, roleCatalogRoleSchema, roleCatalogUpdateSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { RoleCatalogService } from './role-catalog.service.js';

export function registerRoleCatalogRoutes(app: FastifyInstance, service: RoleCatalogService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'rol.administrar' as const };
  routes.get('/api/v1/admin/catalogo-roles', { config, schema: { response: { 200: roleCatalogSchema } } },
    (request) => service.catalog(request.sesion));
  routes.post('/api/v1/admin/catalogo-roles', { config, schema: { body: roleCatalogInputSchema, response: { 201: roleCatalogRoleSchema } } },
    async (request, reply) => { const saved = await service.create(request.sesion, request.body); reply.code(201); return saved; });
  routes.put('/api/v1/admin/catalogo-roles/:id', { config, schema: { params: adminParamsSchema, body: roleCatalogUpdateSchema,
    response: { 200: roleCatalogRoleSchema } } }, (request) => service.edit(request.sesion, request.params.id, request.body));
}
