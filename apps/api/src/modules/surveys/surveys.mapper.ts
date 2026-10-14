import { surveyDetailSchema } from '@helpdesk/contracts';
import type { SurveyRow } from './surveys.repository.js';

export function mapSurvey(row: SurveyRow, csrfToken: string) {
  return surveyDetailSchema.parse({ numero: row.numero, titulo: row.titulo, atendidoPor: row.atendidoPor,
    fechaCierre: row.fechaCierre?.toISOString(), expiraEn: row.expiraEn.toISOString(), csrfToken });
}
