import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { simulatedMailSchema, simulatedMailReceiptSchema } from '@helpdesk/contracts';
import type { MailIngestService } from './index.js';

export function registerMailIngestRoutes(app: FastifyInstance, service: MailIngestService) {
  app.withTypeProvider<ZodTypeProvider>().post('/api/v1/correo-simulado', { bodyLimit: 80_000, config: { permiso: 'parametro.administrar' },
    schema: { body: simulatedMailSchema, response: { 202: simulatedMailReceiptSchema } } }, async (request, reply) => reply.code(202).send(await service.enqueue(request.sesion, request.body)));
}
