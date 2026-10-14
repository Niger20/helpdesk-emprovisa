import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

export function createPausesRepository(executor: Database | Transaction<DB>) {
  return {
    openPause: (idTicket: number) => executor.selectFrom('pausasSla').selectAll().where('idTicket', '=', idTicket).where('fin', 'is', null).executeTakeFirst(),
    beginPause: (idTicket: number, motivo: string, detalle: string, referenciaExterna: string | null, context: SessionContext, now: Date) => executor.insertInto('pausasSla')
      .values({ idTicket, motivo, detalle, referenciaExterna, iniciadaPor: context.usuario.idUsuario, inicio: now }).execute(),
    endPause: (idPausa: number, now: Date, minutos: number) => executor.updateTable('pausasSla').set({ fin: now, minutosDescontados: minutos }).where('idPausa', '=', idPausa).execute(),
  };
}
