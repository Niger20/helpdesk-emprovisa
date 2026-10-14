import type { Database } from '../../../infra/db/client.js';
import { createSlaSettingsRepository } from './sla.repository.js';
import { buildSlaSettingsService } from './sla.service.js';

export const createSlaSettingsService = (database: Database) => buildSlaSettingsService(createSlaSettingsRepository(database));
export { registerSlaSettingsRoutes } from './sla.routes.js';
export type { SlaSettingsService } from './sla.service.js';
