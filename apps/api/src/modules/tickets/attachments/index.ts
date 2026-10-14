import type { Database } from '../../../infra/db/client.js';
import { createLocalStorage } from '../../../infra/storage/local-storage.js';
import { createAttachmentsRepository, withAttachmentsTransaction } from './attachments.repository.js';
import { buildAttachmentsService } from './attachments.service.js';

export const createAttachmentsService = (database: Database, storageDir: string) => buildAttachmentsService(createAttachmentsRepository(database), createLocalStorage(storageDir), (action) => withAttachmentsTransaction(database, action));
export { registerAttachmentsRoutes } from './attachments.routes.js';
export type { AttachmentsService } from './attachments.service.js';
