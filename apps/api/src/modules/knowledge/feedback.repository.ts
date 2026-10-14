import type { KnowledgeVote, KnowledgeLink } from '@helpdesk/contracts';
import type { Database, DatabaseExecutor } from '../../infra/db/client.js';
import type { SessionContext } from '../auth/index.js';

function queries(executor: DatabaseExecutor) {
  return {
    executor,
    lock: (id: number) => executor.selectFrom('articulosKb').selectAll().where('idArticulo', '=', id).forUpdate().executeTakeFirst(),
    vote: (id: number, user: number) => executor.selectFrom('kbVotos').select(['util', 'comentario']).where('idArticulo', '=', id).where('idUsuario', '=', user).executeTakeFirst(),
    counts: async (id: number) => {
      const rows = await executor.selectFrom('kbVotos').select('util').select((eb) => eb.fn.countAll().as('total')).where('idArticulo', '=', id).groupBy('util').execute();
      return { utiles: Number(rows.find((row) => row.util)?.total ?? 0), noUtiles: Number(rows.find((row) => !row.util)?.total ?? 0) };
    },
    saveVote: async (id: number, user: number, input: KnowledgeVote, now: Date) => {
      await executor.insertInto('kbVotos').values({ idArticulo: id, idUsuario: user, ...input, fecha: now })
        .onConflict((oc) => oc.columns(['idArticulo', 'idUsuario']).doUpdateSet({ ...input, fecha: now })).execute();
    },
    links: (id: number) => executor.selectFrom('ticketArticulos as l').innerJoin('tickets as t', 't.idTicket', 'l.idTicket')
      .select(['t.numero', 'l.uso', 'l.fecha']).where('l.idArticulo', '=', id).orderBy('l.fecha', 'desc').execute(),
    link: (id: number, ticket: number) => executor.selectFrom('ticketArticulos').select('uso').where('idArticulo', '=', id).where('idTicket', '=', ticket).executeTakeFirst(),
    saveLink: async (id: number, ticket: number, input: KnowledgeLink, context: SessionContext, now: Date) => {
      await executor.insertInto('ticketArticulos').values({ idArticulo: id, idTicket: ticket, uso: input.uso, vinculadoPor: context.usuario.idUsuario, fecha: now })
        .onConflict((oc) => oc.columns(['idArticulo', 'idTicket']).doUpdateSet({ uso: input.uso, vinculadoPor: context.usuario.idUsuario, fecha: now })).execute();
    },
    removeLink: async (id: number, ticket: number) => {
      await executor.deleteFrom('ticketArticulos').where('idArticulo', '=', id).where('idTicket', '=', ticket).execute();
    },
    audit: async (id: number, action: string, context: SessionContext, now: Date, ticket?: number) => {
      if (ticket) await executor.insertInto('bitacora').values({ idTicket: ticket, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion,
        accion: action, fechaHora: now, automatica: false, direccionIp: context.direccionIp ?? null, campoAfectado: 'ticket_articulos',
        valorAnterior: null, valorNuevo: { idArticulo: id }, hashPrevio: '', hashRegistro: '' }).execute();
      await executor.insertInto('auditoriaSistema').values({ entidad: ticket ? 'ticket_articulos' : 'kb_votos', idEntidad: String(id),
        accion: action, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, fechaHora: now, resultado: 'EXITO',
        direccionIp: context.direccionIp ?? null, detalle: ticket ? { idArticulo: id, idTicket: ticket } : { idArticulo: id }, hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
export function createFeedbackRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) => database.transaction().execute((trx) => action(queries(trx))) };
}
export type FeedbackRepository = ReturnType<typeof createFeedbackRepository>;
