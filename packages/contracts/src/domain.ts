import { z } from 'zod';

export const tipoTicketSchema = z.enum(['INCIDENTE', 'SOLICITUD']);
export const estadoTicketSchema = z.enum([
  'NUEVO', 'ASIGNADO', 'EN_ATENCION', 'EN_ESPERA', 'ESCALADO',
  'RESUELTO', 'CERRADO', 'REABIERTO', 'CANCELADO',
]);
export const prioridadSchema = z.enum(['P1', 'P2', 'P3', 'P4']);
export const impactoSchema = z.enum(['ALTO', 'MEDIO', 'BAJO']);
export const urgenciaSchema = z.enum(['ALTA', 'MEDIA', 'BAJA']);
export const rolSchema = z.enum(['SOLICITANTE', 'ANALISTA_N1', 'ESPECIALISTA_N2', 'JEFE_TI', 'AUDITOR']);
export const canalIngresoSchema = z.enum(['PORTAL', 'CORREO', 'TELEFONO', 'PRESENCIAL']);
export type EstadoTicket = z.infer<typeof estadoTicketSchema>;
export type Rol = z.infer<typeof rolSchema>;
