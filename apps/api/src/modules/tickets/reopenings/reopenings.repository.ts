import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';

export function createReopeningsRepository(executor: Database | Transaction<DB>) {
  return { reopeningRecord: (idTicket: number, userId: number, motivo: string, now: Date, nuevoLimiteSolucion: Date) => executor.insertInto('ticketReaperturas')
    .values({ idTicket, solicitadaPor: userId, motivo, fecha: now, nuevoLimiteSolucion }).execute() };
}
