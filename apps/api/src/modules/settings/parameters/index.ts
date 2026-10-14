import type { Database } from '../../../infra/db/client.js';
import { createParametersRepository } from './parameters.repository.js';
import { buildParametersService } from './parameters.service.js';

export const createParametersService = (database: Database) => buildParametersService(createParametersRepository(database));
export { registerParametersRoutes } from './parameters.routes.js';
export type { ParametersService } from './parameters.service.js';
