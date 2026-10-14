import { knowledgeParamsSchema, knowledgeQuerySchema, knowledgeListSchema, knowledgeDetailSchema,
  knowledgeCreateSchema, knowledgeUpdateSchema, knowledgeCatalogSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { KnowledgeService } from './knowledge.service.js';

export function registerKnowledgeRoutes(app: FastifyInstance, service: KnowledgeService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/conocimientos', { config: { permiso: 'kb.ver' },
    schema: { querystring: knowledgeQuerySchema, response: { 200: knowledgeListSchema } } }, (request) => service.list(request.sesion, request.query));
  routes.get('/api/v1/conocimientos/catalogos', { config: { permiso: 'kb.ver' },
    schema: { response: { 200: knowledgeCatalogSchema } } }, (request) => service.catalogs(request.sesion));
  routes.get('/api/v1/conocimientos/:idArticulo', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeParamsSchema, response: { 200: knowledgeDetailSchema } } }, (request) => service.detail(request.sesion, request.params.idArticulo));
  routes.post('/api/v1/conocimientos', { bodyLimit: 450_000, config: { permiso: 'kb.editar' },
    schema: { body: knowledgeCreateSchema, response: { 201: knowledgeDetailSchema } } }, async (request, reply) => {
    const result = await service.create(request.sesion, request.body); reply.code(201); return result;
  });
  routes.put('/api/v1/conocimientos/:idArticulo', { bodyLimit: 450_000, config: { permiso: 'kb.editar' },
    schema: { params: knowledgeParamsSchema, body: knowledgeUpdateSchema, response: { 200: knowledgeDetailSchema } } },
  (request) => service.update(request.sesion, request.params.idArticulo, request.body));
}
