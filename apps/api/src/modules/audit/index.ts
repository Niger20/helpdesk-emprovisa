import type { Database } from '../../infra/db/client.js';
import { createAuditRepository } from './audit.repository.js';
import { buildAuditService, buildReportRecorder } from './audit.service.js';
export const createAuditService = (readonly: Database) => buildAuditService(createAuditRepository(readonly));
export const createReportAuditRecorder = (database: Database) => buildReportRecorder(createAuditRepository(database));
export type AuditService = ReturnType<typeof createAuditService>;
export type ReportAuditRecorder = ReturnType<typeof createReportAuditRecorder>;
export { registerAuditRoutes } from './audit.routes.js';
