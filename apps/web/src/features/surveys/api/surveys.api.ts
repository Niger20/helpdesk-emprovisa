import { surveyDetailSchema, surveyReceiptSchema } from '@helpdesk/contracts';
import type { SurveyResponse } from '@helpdesk/contracts';
import { http, HttpError } from '../../../lib/http';

const endpoint = '/api/v1/encuestas/actual';
export async function loadSurvey(token: string) {
  try { return await http(endpoint, surveyDetailSchema, { headers: { 'x-survey-token': token }, cache: 'no-store' }); }
  catch (error) { if (error instanceof HttpError && error.status === 404) return null; throw error; }
}
export const respondSurvey = (token: string, csrfToken: string, response: SurveyResponse) => http(endpoint, surveyReceiptSchema, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-survey-token': token, 'x-csrf-token': csrfToken },
  body: JSON.stringify(response),
});
