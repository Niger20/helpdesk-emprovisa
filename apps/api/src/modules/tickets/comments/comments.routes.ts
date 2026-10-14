import { z } from 'zod';
import { numeroTicketSchema, ticketCommentSchema, ticketActionResultSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { TicketsService } from '../tickets.service.js';

export function registerCommentsRoutes(app: FastifyInstance, service: TicketsService) {
  app.withTypeProvider<ZodTypeProvider>().post('/api/v1/tickets/:numero/comentarios', {
    bodyLimit: 40_000, config: { permiso: 'ticket.comentar' }, schema: { params: z.object({ numero: numeroTicketSchema }), body: ticketCommentSchema, response: { 201: ticketActionResultSchema } },
  }, async (request, reply) => reply.code(201).send(await service.comment(request.sesion, request.params.numero, request.body)));
}
