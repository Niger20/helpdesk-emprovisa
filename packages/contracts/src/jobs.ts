import { z } from 'zod';

export const jobCodeSchema = z.enum(['sla-threshold', 'sla-breach-escalation', 'auto-close-resolved', 'mail-ingest', 'notification-dispatch', 'audit-chain-verify']);
export type JobCode = z.infer<typeof jobCodeSchema>;
export const notificationEventSchema = z.enum(['CREACION', 'ASIGNACION', 'ESCALAMIENTO', 'RESOLUCION', 'CIERRE', 'ALERTA_SLA']);
export const notificationStateSchema = z.enum(['PENDIENTE', 'ENVIADA', 'ERROR']);
export const jobStatusSchema = z.object({ codigo: jobCodeSchema, activa: z.boolean(), expresionCron: z.string(),
  ultimaEjecucion: z.iso.datetime().nullable(), ultimoResultado: z.string().nullable() });
export const automationStatusSchema = z.object({ tareas: z.array(jobStatusSchema),
  notificaciones: z.object({ pendientes: z.number().int(), enviadas: z.number().int(), fallidas: z.number().int() }), simulada: z.literal(true) });
export const notificationListSchema = z.object({ data: z.array(z.object({ idNotificacion: z.string(), numero: z.string().nullable(),
  asunto: z.string(), estado: notificationStateSchema, intentos: z.number().int(), encoladaEn: z.iso.datetime(), enviadaEn: z.iso.datetime().nullable() })),
  meta: z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }), simulada: z.literal(true) });
export const notificationQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) });
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export const surveyInvitationSchema = z.object({ numero: z.string(), enlace: z.string().regex(/^\/encuesta#[a-f0-9]{64}$/), expiraEn: z.iso.datetime() });
export type SurveyInvitationCandidate = z.infer<typeof surveyInvitationSchema>;
export const surveyInvitationsSchema = z.object({ data: z.array(surveyInvitationSchema), simulada: z.literal(true) });
