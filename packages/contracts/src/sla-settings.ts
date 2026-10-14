import { z } from 'zod';
import { impactoSchema, prioridadSchema, urgenciaSchema } from './domain.js';

export const slaNormativa = {
  P1: { minutosRespuesta: 15, minutosSolucion: 120, modoCalendario: 'CONTINUO', porcentajeAlerta: 50 },
  P2: { minutosRespuesta: 30, minutosSolucion: 240, modoCalendario: 'CONTINUO', porcentajeAlerta: 50 },
  P3: { minutosRespuesta: 120, minutosSolucion: 480, modoCalendario: 'LABORAL', porcentajeAlerta: 50 },
  P4: { minutosRespuesta: 240, minutosSolucion: 1440, modoCalendario: 'LABORAL', porcentajeAlerta: 50 },
} as const;
export const matrizNormativa = {
  ALTO: { ALTA: prioridadSchema.enum.P1, MEDIA: prioridadSchema.enum.P2, BAJA: prioridadSchema.enum.P3 },
  MEDIO: { ALTA: prioridadSchema.enum.P2, MEDIA: prioridadSchema.enum.P3, BAJA: prioridadSchema.enum.P3 },
  BAJO: { ALTA: prioridadSchema.enum.P3, MEDIA: prioridadSchema.enum.P4, BAJA: prioridadSchema.enum.P4 },
} as const;
const plazosSchema = z.object({ minutosRespuesta: z.number().int().positive(), minutosSolucion: z.number().int().positive(),
  modoCalendario: z.enum(['CONTINUO', 'LABORAL']), porcentajeAlerta: z.number().int().min(1).max(99) });
export const slaPrioritySchema = plazosSchema.extend({ codigo: prioridadSchema, nombre: z.string().trim().min(1).max(30),
  activa: z.boolean(), normativa: plazosSchema, cumpleNormativa: z.boolean() });
export const slaMatrixEntrySchema = z.object({ impacto: impactoSchema, urgencia: urgenciaSchema,
  prioridad: prioridadSchema, prioridadNormativa: prioridadSchema, cumpleNormativa: z.boolean() });
export const slaSettingsSchema = z.object({ prioridades: z.array(slaPrioritySchema), matriz: z.array(slaMatrixEntrySchema),
  revision: z.string().regex(/^[a-f0-9]{64}$/), cumpleNormativa: z.boolean() });
export const slaPriorityParamsSchema = z.object({ codigo: prioridadSchema }).strict();
export const slaPriorityUpdateSchema = z.object({ nombre: z.string().trim().min(1).max(30),
  revisionAnterior: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type SlaSettings = z.infer<typeof slaSettingsSchema>;
export type SlaPriority = z.infer<typeof slaPrioritySchema>;
export type SlaPriorityUpdate = z.infer<typeof slaPriorityUpdateSchema>;
