import type { Database } from '../../infra/db/client.js';
import { createCatalogRepository } from './catalog.repository.js';
import { buildCatalogService } from './catalog.service.js';

export const createCatalogService = (database: Database) => buildCatalogService(createCatalogRepository(database));
export { registerCatalogRoutes } from './catalog.routes.js';
export type { CatalogService } from './catalog.service.js';
