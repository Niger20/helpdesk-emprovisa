import { z } from 'zod';
import { numeroTicketSchema, ticketAssignSchema, ticketVersionSchema, ticketActionResultSchema, ticketOperationSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { TicketsService } from '../tickets.service.js';

export function registerAssignmentsRoutes(app: FastifyInstance, service: TicketsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const params = z.object({ numero: numeroTicketSchema });
  routes.get('/api/v1/tickets/:numero/operacion', { config: { permiso: 'ticket.ver' }, schema: { params, response: { 200: ticketOperationSchema } } }, (request) => service.operation(request.sesion, request.params.numero));
  routes.post('/api/v1/tickets/:numero/asignar', { config: { permiso: 'ticket.asignar' }, schema: { params, body: ticketAssignSchema, response: { 200: ticketActionResultSchema } } }, (request) => service.assign(request.sesion, request.params.numero, request.body));
  routes.post('/api/v1/tickets/:numero/atender', { config: { permiso: 'ticket.atender' }, schema: { params, body: ticketVersionSchema, response: { 200: ticketActionResultSchema } } }, (request) => service.attend(request.sesion, request.params.numero, request.body));
}
