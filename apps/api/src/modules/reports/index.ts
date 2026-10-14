import type { Database } from '../../infra/db/client.js';
import { createReportsRepository } from './reports.repository.js';
import { buildReportsService } from './reports.service.js';

export const createReportsService = (readonlyDatabase: Database) => buildReportsService(createReportsRepository(readonlyDatabase));
export { registerReportsRoutes } from './reports.routes.js';
export type { ReportsService } from './reports.service.js';
