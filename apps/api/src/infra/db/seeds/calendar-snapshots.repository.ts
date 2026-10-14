import type { SeedTransaction } from './context.js';
import { captureTicketCalendar } from '../../../modules/tickets/index.js';

export async function seedCalendarSnapshots(trx: SeedTransaction, now: Date) {
  const tickets = await trx.selectFrom('tickets').select(['idTicket', 'idSede', 'numeroReaperturas']).orderBy('idTicket').execute();
  for (const ticket of tickets) await captureTicketCalendar(trx, ticket, now);
}
