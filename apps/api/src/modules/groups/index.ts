import type { Database } from '../../infra/db/client.js';
import { createGroupsRepository } from './groups.repository.js';
import { buildGroupsService } from './groups.service.js';

export const createGroupsService = (database: Database) => buildGroupsService(createGroupsRepository(database));
export { registerGroupsRoutes } from './groups.routes.js';
export type { GroupsService } from './groups.service.js';
