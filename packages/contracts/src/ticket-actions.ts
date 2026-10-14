import { z } from 'zod';
import { numeroTicketSchema } from './tickets.js';

export const visibilidadComentarioSchema = z.enum(['PUBLICO', 'INTERNO']);
export const ticketVersionSchema = z.object({ version: z.number().int().positive() }).strict();
export const ticketAssignSchema = ticketVersionSchema.extend({ idUsuario: z.number().int().positive(), motivo: z.string().trim().min(1, 'Indicá el motivo.').max(200) }).strict();
export const ticketCommentSchema = ticketVersionSchema.extend({ contenido: z.string().trim().min(1, 'Escribí el mensaje.').max(8000), visibilidad: visibilidadComentarioSchema }).strict();
export const ticketActionResultSchema = z.object({ numero: numeroTicketSchema });
export const ticketOperationSchema = z.object({ version: z.number().int().positive(), puedeComentar: z.boolean(), puedeNotaInterna: z.boolean(),
  puedeTomar: z.boolean(), puedeAtender: z.boolean(), puedeReasignar: z.boolean(),
  candidatos: z.array(z.object({ idUsuario: z.number().int().positive(), nombreCompleto: z.string() })),
});
export type TicketAssign = z.infer<typeof ticketAssignSchema>;
export type TicketComment = z.infer<typeof ticketCommentSchema>;
export type TicketOperation = z.infer<typeof ticketOperationSchema>;
