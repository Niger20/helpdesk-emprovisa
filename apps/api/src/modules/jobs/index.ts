import type { Database, DatabaseExecutor } from '../../infra/db/client.js';
import { createJobsRepository, withJobsTransaction } from './jobs.repository.js';
import { createJobsService } from './jobs.service.js';
import type { SurveyDelivery } from '../../infra/mail/survey-delivery.js';
export const buildJobsService = (database: Database, dispatch: (executor: DatabaseExecutor, now: Date) => Promise<void>, ingest: (executor: DatabaseExecutor, now: Date) => Promise<void>, delivery?: SurveyDelivery) =>
  createJobsService(createJobsRepository(database), (action) => withJobsTransaction(database, action), dispatch, ingest, delivery);
export type JobsService = ReturnType<typeof buildJobsService>;
export { registerJobsRoutes } from './jobs.routes.js';
