import type { Database } from '../../../infra/db/client.js';
import { createRoleCatalogRepository } from './role-catalog.repository.js';
import { buildRoleCatalogService } from './role-catalog.service.js';

export const createRoleCatalogService = (database: Database) => buildRoleCatalogService(createRoleCatalogRepository(database));
export { registerRoleCatalogRoutes } from './role-catalog.routes.js';
export type { RoleCatalogService } from './role-catalog.service.js';
