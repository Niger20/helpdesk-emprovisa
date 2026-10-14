import { surveyTokenSchema, surveyResponseSchema, surveyReceiptSchema } from '@helpdesk/contracts';
import type { SurveyResponse } from '@helpdesk/contracts';
import { newToken, tokenHash, csrfToken, tokensEqual } from '../../common/crypto/session-tokens.js';
import { AppError } from '../../common/errors/app-error.js';
import { mapSurvey } from './surveys.mapper.js';
import type { SurveysRepository, SurveyRow } from './surveys.repository.js';

function requireAvailable(row: SurveyRow | undefined, now: Date): asserts row is SurveyRow {
  if (!row || row.respondidaEn || row.expiraEn <= now || row.codigo !== 'CERRADO' || !row.fechaCierre) {
    throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El enlace no está disponible: es inválido, venció o la encuesta ya fue respondida.');
  }
}

export function buildSurveysService(repository: SurveysRepository, secret: string) {
  return {
    detail: async (token: string, now = new Date()) => {
      const validToken = surveyTokenSchema.parse(token);
      const row = await repository.find(tokenHash(validToken));
      requireAvailable(row, now);
      return mapSurvey(row, csrfToken(secret, `survey:${validToken}`));
    },
    respond: async (token: string, input: SurveyResponse, csrf: unknown, now = new Date(), ip?: string) => {
      const validToken = surveyTokenSchema.parse(token);
      const data = surveyResponseSchema.parse(input);
      if (!tokensEqual(csrfToken(secret, `survey:${validToken}`), csrf)) {
        throw new AppError('CSRF_INVALIDO', 403, 'Recargá la encuesta antes de enviar tu respuesta.');
      }
      return repository.atomic(async (trx) => {
        const hash = tokenHash(validToken);
        const row = await trx.find(hash);
        requireAvailable(row, now);
        const answered = await trx.answer(hash, data, now);
        if (!answered) {
          throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'La encuesta ya fue respondida o venció.');
        }
        await trx.auditResponse(answered.idEncuesta, answered.idTicket, data.calificacion, now, ip);
        return surveyReceiptSchema.parse({ numero: row.numero, calificacion: data.calificacion });
      });
    },
  };
}

export async function issueSurvey(queries: Pick<SurveysRepository, 'lockTicket' | 'existing' | 'insert'>,
  idTicket: number, now = new Date(), validityDays = 7) {
  if (!Number.isSafeInteger(idTicket) || idTicket < 1 || !Number.isSafeInteger(validityDays) || validityDays < 1 || validityDays > 365) {
    throw new AppError('ENTRADA_INVALIDA', 400, 'El ticket o la vigencia de la encuesta no son válidos.');
  }
  const ticket = await queries.lockTicket(idTicket);
  if (!ticket || ticket.codigo !== 'CERRADO') throw new AppError('TRANSICION_INVALIDA', 409, 'La encuesta se emite después del cierre.');
  if (await queries.existing(idTicket)) return null;
  const token = newToken();
  const expires = new Date(now.getTime() + validityDays * 86_400_000);
  await queries.insert(idTicket, tokenHash(token), now, expires);
  return { token, enlace: `/encuesta#${token}`, expiraEn: expires.toISOString() };
}
export type SurveysService = ReturnType<typeof buildSurveysService>;
