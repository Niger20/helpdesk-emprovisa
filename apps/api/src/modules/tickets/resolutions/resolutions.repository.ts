import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';

export function createResolutionsRepository(executor: Database | Transaction<DB>) {
  return {
    resolveRecord: (idTicket: number, ciclo: number, idResolutor: number, causa: string | null, solucion: string, now: Date) => executor.insertInto('ticketResoluciones')
      .values({ idTicket, ciclo, idResolutor, causa, solucion, fechaResolucion: now }).execute(),
    addResolutionComment: (idTicket: number, contenido: string, idAutor: number, now: Date) => executor.insertInto('ticketComentarios')
      .values({ idTicket, idAutor, contenido, visibilidad: 'PUBLICO', origen: 'PORTAL', fechaCreacion: now }).execute(),
  };
}
