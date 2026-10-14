import { knowledgeParamsSchema, knowledgeFeedbackSchema, knowledgeVoteSchema, knowledgeFeedbackResultSchema,
  knowledgeLinksSchema, knowledgeLinkSchema, knowledgeLinkParamsSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { FeedbackService } from './feedback.service.js';

export function registerFeedbackRoutes(app: FastifyInstance, service: FeedbackService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/conocimientos/:idArticulo/utilidad', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeParamsSchema, response: { 200: knowledgeFeedbackSchema } } }, (req) => service.feedback(req.sesion, req.params.idArticulo));
  routes.put('/api/v1/conocimientos/:idArticulo/utilidad', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeParamsSchema, body: knowledgeVoteSchema, response: { 200: knowledgeFeedbackResultSchema } } }, (req) => service.vote(req.sesion, req.params.idArticulo, req.body));
  routes.get('/api/v1/conocimientos/:idArticulo/tickets', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeParamsSchema, response: { 200: knowledgeLinksSchema } } }, (req) => service.links(req.sesion, req.params.idArticulo));
  routes.put('/api/v1/conocimientos/:idArticulo/tickets', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeParamsSchema, body: knowledgeLinkSchema, response: { 200: knowledgeFeedbackResultSchema } } }, (req) => service.link(req.sesion, req.params.idArticulo, req.body));
  routes.delete('/api/v1/conocimientos/:idArticulo/tickets/:numero', { config: { permiso: 'kb.ver' },
    schema: { params: knowledgeLinkParamsSchema, response: { 200: knowledgeFeedbackResultSchema } } },
  (req) => service.link(req.sesion, req.params.idArticulo, { numero: req.params.numero, uso: 'consulta' }, true));
}
