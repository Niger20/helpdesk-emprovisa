import type { Database } from '../../../infra/db/client.js';
import { createCalendarsRepository } from './calendars.repository.js';
import { buildCalendarsService } from './calendars.service.js';

export const createCalendarsService = (database: Database) => buildCalendarsService(createCalendarsRepository(database));
export { registerCalendarsRoutes } from './calendars.routes.js';
export type { CalendarsService } from './calendars.service.js';
