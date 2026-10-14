import type { DatabaseExecutor } from '../../infra/db/client.js';
import { createMailIngestRepository } from './mail-ingest.repository.js';
import { createMailIngestService } from './mail-ingest.service.js';
export const buildMailIngestService = (executor: DatabaseExecutor) => createMailIngestService(createMailIngestRepository(executor));
export type MailIngestService = ReturnType<typeof buildMailIngestService>;
export { registerMailIngestRoutes } from './mail-ingest.routes.js';
