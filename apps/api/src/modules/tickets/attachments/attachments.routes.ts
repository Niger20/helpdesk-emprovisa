import { z } from 'zod';
import { numeroTicketSchema, adjuntoSchema, adjuntosSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { AttachmentsService } from './attachments.service.js';
import { readAttachment } from './attachments.multipart.js';
import { attachmentDisposition } from '../../../infra/storage/local-storage.js';

export function registerAttachmentsRoutes(app: FastifyInstance, service: AttachmentsService) {
  const api = app.withTypeProvider<ZodTypeProvider>();
  const params = z.object({ numero: numeroTicketSchema });
  api.get('/api/v1/tickets/:numero/adjuntos', { config: { permiso: 'ticket.ver' }, schema: { params, response: { 200: adjuntosSchema } } },
    (request) => service.list(request.sesion, request.params.numero));
  api.post('/api/v1/tickets/:numero/adjuntos', { config: { permiso: 'ticket.adjuntar' }, schema: { params, response: { 201: adjuntoSchema } } }, async (request, reply) => {
    const file = await readAttachment(request, await service.uploadLimit(request.sesion, request.params.numero));
    return reply.code(201).send(await service.upload(request.sesion, request.params.numero, file.name, file.buffer));
  });
  api.get('/api/v1/tickets/:numero/adjuntos/:idAdjunto', { config: { permiso: 'ticket.ver' }, schema: {
    params: params.extend({ idAdjunto: z.coerce.number().int().positive() }),
  } }, async (request, reply) => {
    const { archivo, buffer } = await service.download(request.sesion, request.params.numero, request.params.idAdjunto);
    return reply.header('Content-Disposition', attachmentDisposition(archivo.nombreOriginal)).header('Cache-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff').type(archivo.mimeType).send(buffer);
  });
}
