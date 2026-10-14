import { z } from 'zod';
import { numeroTicketSchema, ticketCreateSchema, ticketQuerySchema, ticketListSchema, ticketDetailSchema, ticketOptionsSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { TicketsService } from './tickets.service.js';
import { registerAssignmentsRoutes } from './assignments/assignments.routes.js';
import { registerCommentsRoutes } from './comments/comments.routes.js';
import { registerLifecycleRoutes } from './lifecycle/lifecycle.routes.js';

export function registerTicketsRoutes(app: FastifyInstance, service: TicketsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  registerAssignmentsRoutes(app, service);
  registerCommentsRoutes(app, service);
  registerLifecycleRoutes(app, service);
  routes.get('/api/v1/tickets/options', { config: { permiso: 'ticket.crear' }, schema: { response: { 200: ticketOptionsSchema } } }, (request) => service.options(request.sesion));
  routes.get('/api/v1/tickets', { config: { permiso: 'ticket.ver' }, schema: { querystring: ticketQuerySchema, response: { 200: ticketListSchema } } }, (request) => service.list(request.sesion, request.query));
  routes.get('/api/v1/tickets/:numero', { config: { permiso: 'ticket.ver' }, schema: { params: z.object({ numero: numeroTicketSchema }), response: { 200: ticketDetailSchema } } }, (request) => service.detail(request.sesion, request.params.numero));
  routes.post('/api/v1/tickets', { bodyLimit: 40_000, config: { permiso: 'ticket.crear' }, schema: { body: ticketCreateSchema, response: { 201: z.object({ numero: numeroTicketSchema }) } } }, async (request, reply) => reply.code(201).send(await service.create(request.sesion, request.body)));
}
