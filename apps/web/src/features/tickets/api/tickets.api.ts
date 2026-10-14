import { z } from 'zod';
import { ticketListSchema, ticketDetailSchema, ticketOptionsSchema, numeroTicketSchema } from '@helpdesk/contracts';
import type { TicketCreate } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchTickets = (query: string, signal: AbortSignal) => http(`/api/v1/tickets?${query}`, ticketListSchema, { signal });
export const fetchTicket = (numero: string, signal: AbortSignal) => http(`/api/v1/tickets/${encodeURIComponent(numero)}`, ticketDetailSchema, { signal });
export const fetchTicketOptions = (signal: AbortSignal) => http('/api/v1/tickets/options', ticketOptionsSchema, { signal });
export const createTicket = (data: TicketCreate, csrfToken: string) => http('/api/v1/tickets', z.object({ numero: numeroTicketSchema }), {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(data),
});
