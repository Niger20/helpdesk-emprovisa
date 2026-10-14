import { surveyHeadersSchema, surveyResponseSchema, surveyDetailSchema, surveyReceiptSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { SurveysService } from './surveys.service.js';

export function registerSurveysRoutes(app: FastifyInstance, service: SurveysService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/encuestas/actual', { config: { publica: true, rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { headers: surveyHeadersSchema, response: { 200: surveyDetailSchema } } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer');
    return service.detail(request.headers['x-survey-token']);
  });
  routes.post('/api/v1/encuestas/actual', { bodyLimit: 4096, config: { publica: true, rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { headers: surveyHeadersSchema, body: surveyResponseSchema, response: { 200: surveyReceiptSchema } } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return service.respond(request.headers['x-survey-token'], request.body, request.headers['x-csrf-token'], new Date(), request.ip);
  });
}
