import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

export function createEscalationsRepository(executor: Database | Transaction<DB>) {
  return { escalateRecord: async (idTicket: number, idGrupoDestino: number, idUsuarioDestino: number | null, origen: number, motivo: string, context: SessionContext, now: Date) => {
    await executor.updateTable('ticketAsignaciones').set({ hasta: now }).where('idTicket', '=', idTicket).where('hasta', 'is', null).execute();
    await executor.insertInto('ticketAsignaciones').values({ idTicket, idUsuario: idUsuarioDestino, idGrupo: idGrupoDestino,
      tipo: 'ESCALAMIENTO', asignadoPor: context.usuario.idUsuario, motivo, desde: now }).execute();
    await executor.insertInto('ticketEscalamientos').values({ idTicket, nivelOrigen: origen, nivelDestino: 2, idGrupoDestino,
      tipo: 'MANUAL', motivo, escaladoPor: context.usuario.idUsuario, fecha: now }).execute();
  } };
}
