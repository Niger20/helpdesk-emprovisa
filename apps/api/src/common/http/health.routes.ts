import { healthResponseSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export function registerHealthRoute(app: FastifyInstance, checkHealth: () => Promise<boolean>) {
  app.withTypeProvider<ZodTypeProvider>().get('/health', {
    config: { publica: true },
    schema: { response: { 200: healthResponseSchema, 503: healthResponseSchema } },
  }, async (_request, reply) => {
    const disponible = await checkHealth();
    return reply.code(disponible ? 200 : 503).send({
      estado: disponible ? 'DISPONIBLE' : 'NO_DISPONIBLE', fechaHora: new Date().toISOString(),
    });
  });
}
