import { z } from 'zod';
import { impactoSchema, urgenciaSchema, prioridadSchema } from './domain.js';
import type { Permiso } from './permissions.js';

const base = { version: z.number().int().positive() };
const reason = z.string().trim().min(1, 'Indicá el motivo.').max(200);
export const motivoPausaSchema = z.enum(['REPUESTOS', 'PROVEEDOR_EXTERNO']);
export const ticketLifecycleActionSchema = z.enum(['reclasificar', 'escalar', 'pausar', 'reanudar', 'resolver', 'cerrar', 'reabrir', 'cancelar', 'rechazar']);
export const ticketLifecycleSchema = z.discriminatedUnion('accion', [
  z.object({ ...base, accion: z.literal('reclasificar'), idCategoria: z.number().int().positive(), idActivo: z.number().int().positive().nullable(),
    impacto: impactoSchema, urgencia: urgenciaSchema, prioridad: prioridadSchema.nullable(), justificacionPrioridad: reason }).strict(),
  z.object({ ...base, accion: z.literal('escalar'), idGrupoDestino: z.number().int().positive(), idUsuarioDestino: z.number().int().positive().nullable(), motivo: reason }).strict(),
  z.object({ ...base, accion: z.literal('pausar'), motivo: motivoPausaSchema, detalle: z.string().trim().min(1, 'Describí la espera.').max(250), referenciaExterna: z.string().trim().max(60).nullable() }).strict(),
  z.object({ ...base, accion: z.literal('reanudar'), motivo: reason }).strict(),
  z.object({ ...base, accion: z.literal('resolver'), causa: z.string().trim().max(100).nullable(), solucion: z.string().trim().min(1, 'Describí la solución.').max(8000) }).strict(),
  z.object({ ...base, accion: z.literal('cerrar'), confirmacion: z.boolean().refine((value) => value, 'Confirmá que la solución fue satisfactoria.') }).strict(),
  z.object({ ...base, accion: z.literal('reabrir'), motivo: reason }).strict(),
  z.object({ ...base, accion: z.literal('cancelar'), motivo: reason }).strict(),
  z.object({ ...base, accion: z.literal('rechazar'), motivo: reason }).strict(),
]);
export const ticketLifecyclePermission: Record<z.infer<typeof ticketLifecycleActionSchema>, Permiso> = {
  reclasificar: 'ticket.reclasificar', escalar: 'ticket.escalar', pausar: 'sla.pausar', reanudar: 'sla.reanudar',
  resolver: 'ticket.resolver', cerrar: 'ticket.cerrar', reabrir: 'ticket.reabrir', cancelar: 'ticket.cancelar', rechazar: 'ticket.reabrir',
};
export const ticketLifecycleOptionsSchema = z.object({ version: z.number().int().positive(), acciones: z.array(ticketLifecycleActionSchema),
  fechaLimiteReapertura: z.iso.datetime().nullable(), requiereTicketNuevo: z.boolean(),
  categorias: z.array(z.object({ idCategoria: z.number().int(), nombre: z.string() })),
  activos: z.array(z.object({ idActivo: z.number().int(), codigoPatrimonial: z.string() })),
  grupos: z.array(z.object({ idGrupo: z.number().int(), nombre: z.string(), integrantes: z.array(z.object({ idUsuario: z.number().int(), nombreCompleto: z.string() })) })),
  actual: z.object({ idCategoria: z.number().int(), idActivo: z.number().int().nullable(), impacto: impactoSchema, urgencia: urgenciaSchema }),
});
export type TicketLifecycleCommand = z.infer<typeof ticketLifecycleSchema>;
export type TicketLifecycleAction = z.infer<typeof ticketLifecycleActionSchema>;
export type TicketLifecycleOptions = z.infer<typeof ticketLifecycleOptionsSchema>;
