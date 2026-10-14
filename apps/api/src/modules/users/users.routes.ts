import { adminCatalogSchema, adminParamsSchema, adminQuerySchema, adminUserListSchema, adminUserSchema, passwordResetSchema,
  userCreateSchema, userEditSchema, userStateSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { UsersService } from './users.service.js';

export function registerUsersRoutes(app: FastifyInstance, service: UsersService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'usuario.administrar' as const };
  routes.get('/api/v1/admin/usuarios', { config, schema: { querystring: adminQuerySchema, response: { 200: adminUserListSchema } } },
    (request) => service.list(request.sesion, request.query));
  routes.get('/api/v1/admin/catalogos', { config, schema: { response: { 200: adminCatalogSchema } } }, (request) => service.catalogs(request.sesion));
  routes.get('/api/v1/admin/usuarios/:id', { config, schema: { params: adminParamsSchema, response: { 200: adminUserSchema } } },
    (request) => service.detail(request.sesion, request.params.id));
  routes.post('/api/v1/admin/usuarios', { config, schema: { body: userCreateSchema, response: { 201: adminUserSchema } } },
    async (request, reply) => { const result = await service.create(request.sesion, request.body); reply.code(201); return result; });
  routes.put('/api/v1/admin/usuarios/:id', { config, schema: { params: adminParamsSchema, body: userEditSchema, response: { 200: adminUserSchema } } },
    (request) => service.edit(request.sesion, request.params.id, request.body));
  routes.put('/api/v1/admin/usuarios/:id/estado', { config, schema: { params: adminParamsSchema, body: userStateSchema, response: { 200: adminUserSchema } } },
    (request) => service.state(request.sesion, request.params.id, request.body.activo));
  routes.post('/api/v1/admin/usuarios/:id/desbloquear', { config, schema: { params: adminParamsSchema, response: { 200: adminUserSchema } } },
    (request) => service.unlock(request.sesion, request.params.id));
  routes.put('/api/v1/admin/usuarios/:id/password', { config, schema: { params: adminParamsSchema, body: passwordResetSchema, response: { 200: adminUserSchema } } },
    (request) => service.resetPassword(request.sesion, request.params.id, request.body.password));
}
