import { adminCatalogSchema, adminParamsSchema, adminQuerySchema, groupInputSchema, groupSchema, groupsListSchema, membershipSchema, membersListSchema,
  specialtySchema, specialtiesListSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { GroupsService } from './groups.service.js';

export function registerGroupsRoutes(app: FastifyInstance, service: GroupsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'rol.administrar' as const };
  routes.get('/api/v1/admin/grupos/catalogos', { config, schema: { response: { 200: adminCatalogSchema } } }, (request) => service.catalogs(request.sesion));
  routes.get('/api/v1/admin/grupos', { config, schema: { querystring: adminQuerySchema, response: { 200: groupsListSchema } } },
    (request) => service.list(request.sesion, request.query));
  routes.post('/api/v1/admin/grupos', { config, schema: { body: groupInputSchema, response: { 201: groupSchema } } },
    async (request, reply) => { const result = await service.create(request.sesion, request.body); reply.code(201); return result; });
  routes.put('/api/v1/admin/grupos/:id', { config, schema: { params: adminParamsSchema, body: groupInputSchema, response: { 200: groupSchema } } },
    (request) => service.edit(request.sesion, request.params.id, request.body));
  routes.get('/api/v1/admin/grupos/:id/miembros', { config, schema: { params: adminParamsSchema, response: { 200: membersListSchema } } },
    (request) => service.members(request.sesion, request.params.id));
  routes.put('/api/v1/admin/grupos/:id/miembros', { config, schema: { params: adminParamsSchema, body: membershipSchema, response: { 200: membersListSchema } } },
    (request) => service.member(request.sesion, request.params.id, request.body));
  routes.delete('/api/v1/admin/grupos/:id/miembros/:idUsuario', { config,
    schema: { params: adminParamsSchema.extend({ idUsuario: z.coerce.number().int().positive() }), response: { 200: membersListSchema } } },
  (request) => service.removeMember(request.sesion, request.params.id, request.params.idUsuario));
  routes.get('/api/v1/admin/usuarios/:id/especialidades', { config, schema: { params: adminParamsSchema, response: { 200: specialtiesListSchema } } },
    (request) => service.specialties(request.sesion, request.params.id));
  routes.put('/api/v1/admin/usuarios/:id/especialidades', { config, schema: { params: adminParamsSchema, body: specialtySchema, response: { 200: specialtiesListSchema } } },
    (request) => service.specialty(request.sesion, request.params.id, request.body));
  routes.delete('/api/v1/admin/usuarios/:id/especialidades/:idCategoria', { config,
    schema: { params: adminParamsSchema.extend({ idCategoria: z.coerce.number().int().positive() }), response: { 200: specialtiesListSchema } } },
  (request) => service.removeSpecialty(request.sesion, request.params.id, request.params.idCategoria));
}
