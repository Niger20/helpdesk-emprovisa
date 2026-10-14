import { z } from 'zod';
import { ticketCreateSchema } from '@helpdesk/contracts';

export const ticketDraftValuesSchema = ticketCreateSchema.extend({
  titulo: z.string().max(ticketCreateSchema.shape.titulo.maxLength ?? 150),
  descripcion: z.string().max(ticketCreateSchema.shape.descripcion.maxLength ?? 8000),
  idCategoria: z.union([z.literal(0), ticketCreateSchema.shape.idCategoria]),
});

export const ticketDraftSchema = z.object({
  version: z.literal(1),
  idUsuario: ticketCreateSchema.shape.idSolicitante,
  guardadoEn: z.number().int().nonnegative(),
  valores: ticketDraftValuesSchema,
}).strict();
