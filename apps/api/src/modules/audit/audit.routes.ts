import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { auditQuerySchema, auditListSchema, auditIntegritySchema } from '@helpdesk/contracts';
import type { AuditService } from './index.js';
export function registerAuditRoutes(app: FastifyInstance, service: AuditService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/auditoria', { config: { permiso: 'auditoria.ver' }, schema: { querystring: auditQuerySchema, response: { 200: auditListSchema } } }, (request, reply) => {
    reply.header('Cache-Control', 'no-store'); return service.list(request.sesion, request.query);
  });
  routes.get('/api/v1/auditoria/integridad', { config: { permiso: 'auditoria.verificar' }, schema: { response: { 200: auditIntegritySchema } } }, (request, reply) => {
    reply.header('Cache-Control', 'no-store'); return service.integrity(request.sesion);
  });
}
