import { reportsQuerySchema, reportsSchema, reportsCatalogSchema, reportsExportParamsSchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ReportsService } from './reports.service.js';

export function registerReportsRoutes(app: FastifyInstance, service: ReportsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/reportes', { config: { permiso: 'reporte.ver' }, schema: { querystring: reportsQuerySchema, response: { 200: reportsSchema } } },
    (request) => service.dashboard(request.sesion, request.query));
  routes.get('/api/v1/reportes/catalogos', { config: { permiso: 'reporte.ver' }, schema: { response: { 200: reportsCatalogSchema } } },
    (request) => service.catalog(request.sesion));
  routes.get('/api/v1/reportes/exportar/:formato', { config: { permiso: 'reporte.exportar' }, schema: { querystring: reportsQuerySchema, params: reportsExportParamsSchema } },
    async (request, reply) => {
      const buffer = await service.export(request.sesion, request.query, request.params.formato);
      reply.header('Cache-Control', 'no-store').header('Content-Disposition', `attachment; filename="EMPROVISA-${request.query.desde}-${request.query.hasta}.${request.params.formato}"`);
      return reply.type(request.params.formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer);
    });
}
