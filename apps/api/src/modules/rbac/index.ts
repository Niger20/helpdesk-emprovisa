import type { Database } from '../../infra/db/client.js';
import { createRbacRepository } from './rbac.repository.js';
import { buildRbacService } from './rbac.service.js';

export const createRbacService = (database: Database) => buildRbacService(createRbacRepository(database));
export { registerRbacRoutes } from './rbac.routes.js';
export type { RbacService } from './rbac.service.js';
