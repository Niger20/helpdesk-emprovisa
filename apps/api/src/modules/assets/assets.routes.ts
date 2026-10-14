import { assetCatalogSchema, assetCreateSchema, assetDetailSchema, assetListSchema, assetParamsSchema, assetQuerySchema } from '@helpdesk/contracts';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { AssetsService } from './assets.service.js';

export function registerAssetsRoutes(app: FastifyInstance, service: AssetsService) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  routes.get('/api/v1/activos', {
    config: { permiso: 'activo.ver' }, schema: { querystring: assetQuerySchema, response: { 200: assetListSchema } },
  }, (request) => service.list(request.sesion, request.query));
  routes.get('/api/v1/activos/catalogos', {
    config: { permiso: 'activo.ver' }, schema: { response: { 200: assetCatalogSchema } },
  }, (request) => service.catalogs(request.sesion));
  routes.get('/api/v1/activos/:codigoPatrimonial', {
    config: { permiso: 'activo.ver' }, schema: { params: assetParamsSchema, response: { 200: assetDetailSchema } },
  }, (request) => service.detail(request.sesion, request.params.codigoPatrimonial));
  routes.post('/api/v1/activos', {
    config: { permiso: 'activo.crear' }, schema: { body: assetCreateSchema, response: { 201: assetDetailSchema } },
  }, async (request, reply) => { const result = await service.create(request.sesion, request.body); reply.code(201); return result; });
}
