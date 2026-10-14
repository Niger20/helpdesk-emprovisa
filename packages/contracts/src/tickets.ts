import { z } from 'zod';
import { tipoTicketSchema, estadoTicketSchema, prioridadSchema, impactoSchema, urgenciaSchema, canalIngresoSchema } from './domain.js';

export const numeroTicketSchema = z.string().regex(/^TK-\d{6,9}$/);
export const ticketCreateSchema = z.object({
  titulo: z.string().trim().min(10, 'El título debe tener al menos 10 caracteres.').max(150),
  descripcion: z.string().trim().min(1, 'Describí el requerimiento.').max(8000),
  tipo: tipoTicketSchema, idCategoria: z.number().int().positive(),
  impacto: impactoSchema, urgencia: urgenciaSchema,
  idActivo: z.number().int().positive().nullable(),
  idSolicitante: z.number().int().positive(), canalIngreso: canalIngresoSchema,
  numeroTicketOrigen: numeroTicketSchema.nullable().optional(),
}).strict();
export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).default(''), estado: estadoTicketSchema.optional(),
  prioridad: prioridadSchema.optional(), sort: z.enum(['-fechaCreacion', 'fechaCreacion']).default('-fechaCreacion'),
});
export const ticketSchema = z.object({
  numero: numeroTicketSchema, titulo: z.string(), descripcion: z.string(), tipo: tipoTicketSchema,
  estado: estadoTicketSchema, prioridad: prioridadSchema, impacto: impactoSchema, urgencia: urgenciaSchema,
  categoria: z.string(), solicitante: z.string(), sede: z.string(), asignado: z.string().nullable(),
  activo: z.string().nullable(), canalIngreso: canalIngresoSchema,
  numeroTicketOrigen: numeroTicketSchema.nullable(),
  fechaCreacion: z.iso.datetime(), fechaLimiteRespuesta: z.iso.datetime(), fechaLimiteSolucion: z.iso.datetime(),
  relojCorre: z.boolean(), porcentajeConsumido: z.number().nonnegative().nullable(),
});
export const ticketListSchema = z.object({ data: z.array(ticketSchema), meta: z.object({
  page: z.number().int(), pageSize: z.number().int(), total: z.number().int(),
}) });
export const ticketDetailSchema = z.object({ ticket: ticketSchema,
  comentarios: z.array(z.object({ contenido: z.string(), visibilidad: z.string(), autor: z.string().nullable(), fechaCreacion: z.iso.datetime() })),
  bitacora: z.array(z.object({ accion: z.string(), autor: z.string().nullable(), fechaHora: z.iso.datetime() })),
});
export const ticketOptionsSchema = z.object({
  categorias: z.array(z.object({ idCategoria: z.number().int(), nombre: z.string(), tipoAplicable: z.string(), requiereActivo: z.boolean() })),
  activos: z.array(z.object({ idActivo: z.number().int(), codigoPatrimonial: z.string(), idSede: z.number().int() })),
  solicitantes: z.array(z.object({ idUsuario: z.number().int(), nombreCompleto: z.string(), idSede: z.number().int() })),
  matriz: z.array(z.object({ impacto: impactoSchema, urgencia: urgenciaSchema, prioridad: prioridadSchema })),
});
export type TicketCreate = z.infer<typeof ticketCreateSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketOptions = z.infer<typeof ticketOptionsSchema>;
