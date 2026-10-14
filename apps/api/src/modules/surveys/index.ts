import type { Database } from '../../infra/db/client.js';
import { createSurveyQueries, createSurveysRepository } from './surveys.repository.js';
import type { SurveyExecutor } from './surveys.repository.js';
import { buildSurveysService, issueSurvey } from './surveys.service.js';

export const createSurveysService = (database: Database, secret: string) => buildSurveysService(createSurveysRepository(database), secret);
export async function createSurveyForClosedTicket(executor: SurveyExecutor, idTicket: number, now = new Date(), validityDays = 7) {
  if (executor.isTransaction) return issueSurvey(createSurveyQueries(executor), idTicket, now, validityDays);
  return executor.transaction().execute((trx) => issueSurvey(createSurveyQueries(trx), idTicket, now, validityDays));
}
export { registerSurveysRoutes } from './surveys.routes.js';
export type { SurveysService } from './surveys.service.js';
