import type { DatabaseExecutor } from '../../infra/db/client.js';
import { createNotificationsRepository } from './notifications.repository.js';
import { createNotificationsService } from './notifications.service.js';
import type { SimulatedTransport } from './notifications.service.js';
export const buildNotificationsService = (executor: DatabaseExecutor, transport?: SimulatedTransport) => createNotificationsService(createNotificationsRepository(executor), transport);
export type NotificationsService = ReturnType<typeof buildNotificationsService>;
export { registerNotificationsRoutes } from './notifications.routes.js';
