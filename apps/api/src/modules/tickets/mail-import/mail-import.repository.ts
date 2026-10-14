import { sql } from 'kysely';
import type { DatabaseExecutor } from '../../../infra/db/client.js';

export function createMailImportRepository(executor: DatabaseExecutor) {
  return {
    lock: (idTicket: number) => executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
      .selectAll('t').select('e.codigo as estado').where('t.idTicket', '=', idTicket).forUpdate('t').executeTakeFirst(),
    reply: async (idTicket: number, idAutor: number, contenido: string, idCorreo: string, now: Date) => {
      await executor.insertInto('ticketComentarios').values({ idTicket, idAutor, contenido, idCorreo, origen: 'CORREO', visibilidad: 'PUBLICO', fechaCreacion: now }).execute();
      await executor.updateTable('tickets').set({ version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
    },
    log: (idTicket: number, idTarea: number, accion: string, now: Date) => executor.insertInto('bitacora')
      .values({ idTicket, idTarea, idUsuario: null, idSesion: null, accion, automatica: true, valorNuevo: { canal: 'CORREO_SIMULADO' }, fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
