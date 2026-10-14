import { ticketLifecycleOptionsSchema, ticketActionResultSchema } from '@helpdesk/contracts';
import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchLifecycle = (numero: string, signal: AbortSignal) => http(`/api/v1/tickets/${encodeURIComponent(numero)}/ciclo`, ticketLifecycleOptionsSchema, { signal });
export const executeLifecycle = (numero: string, data: TicketLifecycleCommand, csrfToken: string) => http(`/api/v1/tickets/${encodeURIComponent(numero)}/${data.accion}`, ticketActionResultSchema, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(data),
});
