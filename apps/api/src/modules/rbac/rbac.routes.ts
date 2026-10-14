import { adminParamsSchema, roleAssignmentSchema, roleLinksSchema, rolesCatalogSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { RbacService } from './rbac.service.js';

export function registerRbacRoutes(app: FastifyInstance, service: RbacService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'rol.administrar' as const };
  routes.get('/api/v1/admin/roles', { config, schema: { response: { 200: rolesCatalogSchema } } }, (request) => service.catalog(request.sesion));
  routes.get('/api/v1/admin/usuarios/:id/roles', { config, schema: { params: adminParamsSchema, response: { 200: roleLinksSchema } } },
    (request) => service.list(request.sesion, request.params.id));
  routes.post('/api/v1/admin/usuarios/:id/roles', { config, schema: { params: adminParamsSchema, body: roleAssignmentSchema, response: { 201: roleLinksSchema } } },
    async (request, reply) => { const result = await service.assign(request.sesion, request.params.id, request.body); reply.code(201); return result; });
  routes.put('/api/v1/admin/usuarios/:id/roles/:idLink', { config,
    schema: { params: adminParamsSchema.extend({ idLink: z.coerce.number().int().positive() }), body: roleAssignmentSchema, response: { 200: roleLinksSchema } } },
  (request) => service.edit(request.sesion, request.params.id, request.params.idLink, request.body));
  routes.delete('/api/v1/admin/usuarios/:id/roles/:idLink', { config,
    schema: { params: adminParamsSchema.extend({ idLink: z.coerce.number().int().positive() }), response: { 200: roleLinksSchema } } },
  (request) => service.remove(request.sesion, request.params.id, request.params.idLink));
}
