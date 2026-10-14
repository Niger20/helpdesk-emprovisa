import type { Ticket } from '@helpdesk/contracts';

export function slaLabel(ticket: Ticket) {
  if (!ticket.relojCorre) return ticket.estado === 'EN_ESPERA' ? 'En pausa' : 'Detenido';
  const used = ticket.porcentajeConsumido ?? 0;
  return used > 100 ? 'Vencido' : used >= 50 ? 'En riesgo' : 'En plazo';
}
