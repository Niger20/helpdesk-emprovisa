import { ticketOperationSchema, ticketActionResultSchema } from '@helpdesk/contracts';
import type { TicketAssign, TicketComment } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchTicketOperation = (numero: string, signal: AbortSignal) => http(`/api/v1/tickets/${encodeURIComponent(numero)}/operacion`, ticketOperationSchema, { signal });
const action = (numero: string, operation: string, data: TicketAssign | TicketComment | { version: number }, csrfToken: string) =>
  http(`/api/v1/tickets/${encodeURIComponent(numero)}/${operation}`, ticketActionResultSchema, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(data),
  });
export const assignTicket = (numero: string, data: TicketAssign, csrfToken: string) => action(numero, 'asignar', data, csrfToken);
export const attendTicket = (numero: string, version: number, csrfToken: string) => action(numero, 'atender', { version }, csrfToken);
export const commentTicket = (numero: string, data: TicketComment, csrfToken: string) => action(numero, 'comentarios', data, csrfToken);
