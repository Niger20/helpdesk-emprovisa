import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { TicketComment } from '@helpdesk/contracts';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

export function createCommentsRepository(executor: Database | Transaction<DB>) {
  return {
    recordFirstResponse: (idTicket: number, now: Date) => executor.updateTable('tickets').set({ fechaPrimeraRespuesta: now }).where('idTicket', '=', idTicket).where('fechaPrimeraRespuesta', 'is', null).execute(),
    addComment: async (idTicket: number, input: TicketComment, context: SessionContext, now: Date) => {
    await executor.insertInto('ticketComentarios').values({ idTicket, idAutor: context.usuario.idUsuario,
      contenido: input.contenido, visibilidad: input.visibilidad, origen: 'PORTAL', fechaCreacion: now }).execute();
    await executor.updateTable('tickets').set({ version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
    await executor.insertInto('bitacora').values({ idTicket, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion,
      accion: input.visibilidad === 'INTERNO' ? 'COMENTARIO_INTERNO' : 'COMENTARIO', fechaHora: now, automatica: false,
      valorNuevo: { visibilidad: input.visibilidad }, hashPrevio: '', hashRegistro: '' }).execute();
  } };
}
