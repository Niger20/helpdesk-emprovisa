import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { notificationListSchema, notificationQuerySchema, surveyInvitationsSchema } from '@helpdesk/contracts';
import type { NotificationsService } from './index.js';

export function registerNotificationsRoutes(app: FastifyInstance, service: NotificationsService, invitations: (idUsuario: number) => { numero: string; enlace: string; expiraEn: string }[] = () => []) {
  app.withTypeProvider<ZodTypeProvider>().get('/api/v1/notificaciones', { config: { permiso: 'auth.sesion' },
    schema: { querystring: notificationQuerySchema, response: { 200: notificationListSchema } } }, (request) => service.list(request.sesion, request.query));
  app.withTypeProvider<ZodTypeProvider>().get('/api/v1/encuestas/invitaciones', { config: { permiso: 'auth.sesion' },
    schema: { response: { 200: surveyInvitationsSchema } } }, (request, reply) => {
    reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer');
    return service.invitations(request.sesion, request.sesion ? invitations(request.sesion.usuario.idUsuario) : []);
  });
}
