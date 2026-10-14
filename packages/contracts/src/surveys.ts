import { z } from 'zod';

export const surveyTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, 'El enlace de encuesta no es válido.');
export const surveyHeadersSchema = z.object({ 'x-survey-token': surveyTokenSchema }).passthrough();
export const surveyResponseSchema = z.object({
  calificacion: z.number().int().min(1, 'Seleccioná una calificación.').max(5),
  comentario: z.string().trim().max(500, 'El comentario admite hasta 500 caracteres.').optional(),
}).strict();
export const surveyDetailSchema = z.object({
  numero: z.string(), titulo: z.string(), atendidoPor: z.string().nullable(),
  fechaCierre: z.iso.datetime(), expiraEn: z.iso.datetime(), csrfToken: surveyTokenSchema,
});
export const surveyReceiptSchema = z.object({ numero: z.string(), calificacion: z.number().int().min(1).max(5) });
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type SurveyDetail = z.infer<typeof surveyDetailSchema>;
export type SurveyReceipt = z.infer<typeof surveyReceiptSchema>;
