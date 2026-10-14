import { z } from 'zod';
import { ticketCreateSchema } from './tickets.js';

export const simulatedMailSchema = z.object({
  messageId: z.string().trim().min(1).max(255), inReplyTo: z.string().trim().min(1).max(255).nullable(),
  usernameRemitente: z.string().trim().min(1).max(80), contenido: z.string().trim().min(1).max(8000),
  solicitud: ticketCreateSchema.omit({ idSolicitante: true, canalIngreso: true, numeroTicketOrigen: true }).nullable(),
}).strict().refine((data) => data.inReplyTo ? data.solicitud === null : data.solicitud !== null,
  'Un mensaje nuevo requiere los datos del ticket; una respuesta usa el hilo existente.');
export type SimulatedMail = z.infer<typeof simulatedMailSchema>;
export const simulatedMailReceiptSchema = z.object({ messageId: z.string(), estado: z.literal('PENDIENTE'), simulada: z.literal(true) });
