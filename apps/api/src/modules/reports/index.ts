import type { Database } from '../../infra/db/client.js';
import { createReportsRepository } from './reports.repository.js';
import { buildReportsService } from './reports.service.js';
import type { ReportAuditRecorder } from '../audit/index.js';

export const createReportsService = (readonlyDatabase: Database, recorder?: ReportAuditRecorder) => buildReportsService(createReportsRepository(readonlyDatabase), recorder);
export { registerReportsRoutes } from './reports.routes.js';
export type { ReportsService } from './reports.service.js';
