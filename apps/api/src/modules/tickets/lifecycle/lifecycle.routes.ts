import { z } from 'zod';
import { numeroTicketSchema, ticketLifecycleSchema, ticketLifecycleActionSchema, ticketLifecyclePermission, ticketLifecycleOptionsSchema, ticketActionResultSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { TicketsService } from '../tickets.service.js';
import { AppError } from '../../../common/errors/app-error.js';

export function registerLifecycleRoutes(app: FastifyInstance, service: TicketsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const params = z.object({ numero: numeroTicketSchema });
  routes.get('/api/v1/tickets/:numero/ciclo', { config: { permiso: 'ticket.ver' }, schema: { params, response: { 200: ticketLifecycleOptionsSchema } } },
    (request) => service.lifecycleOptions(request.sesion, request.params.numero));
  for (const accion of ticketLifecycleActionSchema.options) routes.post(`/api/v1/tickets/:numero/${accion}`, {
    bodyLimit: 40_000, config: { permiso: ticketLifecyclePermission[accion] }, schema: { params, body: ticketLifecycleSchema, response: { 200: ticketActionResultSchema } },
  }, (request) => {
    if (request.body.accion !== accion) throw new AppError('ENTRADA_INVALIDA', 400, 'La acción no corresponde a esta ruta.');
    return service.lifecycle(request.sesion, request.params.numero, request.body);
  });
}
