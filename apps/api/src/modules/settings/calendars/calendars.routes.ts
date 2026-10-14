import { calendarSchema, calendarListSchema, calendarSitesSchema, calendarInputSchema, calendarUpdateSchema, calendarParamsSchema, calendarQuerySchema, calendarBindingParamsSchema, calendarBindingSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { CalendarsService } from './calendars.service.js';

export function registerCalendarsRoutes(app: FastifyInstance, service: CalendarsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>(); const config = { permiso: 'parametro.administrar' as const };
  routes.get('/api/v1/admin/calendarios', { config, schema: { querystring: calendarQuerySchema, response: { 200: calendarListSchema } } }, (req) => service.list(req.sesion, req.query));
  routes.get('/api/v1/admin/calendarios/sedes', { config, schema: { response: { 200: calendarSitesSchema } } }, (req) => service.sites(req.sesion));
  routes.post('/api/v1/admin/calendarios', { config, bodyLimit: 250_000, schema: { body: calendarInputSchema, response: { 201: calendarSchema } } }, async (req, reply) => { const result = await service.create(req.sesion, req.body); reply.code(201); return result; });
  routes.put('/api/v1/admin/calendarios/:idCalendario', { config, bodyLimit: 500_000, schema: { params: calendarParamsSchema, body: calendarUpdateSchema, response: { 200: calendarSchema } } }, (req) => service.edit(req.sesion, req.params.idCalendario, req.body));
  routes.put('/api/v1/admin/calendarios/:idCalendario/sedes/:idSede', { config, schema: { params: calendarBindingParamsSchema, body: calendarBindingSchema, response: { 200: calendarSchema } } }, (req) => service.bind(req.sesion, req.params.idCalendario, req.params.idSede, req.body.idCalendarioAnterior));
}
