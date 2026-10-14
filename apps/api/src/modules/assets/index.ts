import type { Database } from '../../infra/db/client.js';
import { createAssetsRepository } from './assets.repository.js';
import { buildAssetsService } from './assets.service.js';

export const createAssetsService = (database: Database) => buildAssetsService(createAssetsRepository(database));
export { registerAssetsRoutes } from './assets.routes.js';
export type { AssetsService } from './assets.service.js';
