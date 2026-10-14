import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';
import { ticketScope } from '../index.js';

export function createAttachmentsRepository(database: Database, executor: Database | Transaction<DB> = database) {
  const ticketQuery = (context: SessionContext, numero: string) => {
    const scope = ticketScope(context); const now = new Date();
    return executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
      .select(['t.idTicket', 't.idSolicitante', 't.version', 'e.codigo as estado']).where('t.numero', '=', numero)
      .where((eb) => scope.all ? eb.val(true) : eb.or([
        ...(scope.own ? [eb('t.idSolicitante', '=', scope.userId)] : []),
        ...(scope.sites.length ? [eb('t.idSede', 'in', scope.sites)] : []),
        ...(scope.group ? [eb('t.idAsignado', '=', scope.userId), eb('t.idGrupo', 'in', eb.selectFrom('grupoMiembros')
          .select('idGrupo').where('idUsuario', '=', scope.userId)
          .where('desde', '<=', sql<string>`(${now}::timestamptz at time zone 'America/Managua')::date`)
          .where((member) => member.or([member('hasta', 'is', null), member('hasta', '>=', sql<string>`(${now}::timestamptz at time zone 'America/Managua')::date`)])))] : []),
      ]));
  };
  const attachments = (idTicket: number, internal: boolean) => executor.selectFrom('ticketAdjuntos as a')
    .leftJoin('ticketComentarios as c', 'c.idComentario', 'a.idComentario').selectAll('a')
    .where('a.idTicket', '=', idTicket).where('a.estadoValidacion', '=', 'VALIDO')
    .where((eb) => eb.or([eb('a.idComentario', 'is', null), eb.and([eb('c.idTicket', '=', idTicket),
      internal ? eb('c.visibilidad', 'in', ['PUBLICO', 'INTERNO']) : eb('c.visibilidad', '=', 'PUBLICO')])]));
  return {
    ticket: (context: SessionContext, numero: string, lock = false) => lock ? ticketQuery(context, numero).forUpdate('t').executeTakeFirst() : ticketQuery(context, numero).executeTakeFirst(),
    limit: async () => Number((await executor.selectFrom('parametros').select('valor').where('clave', '=', 'adjunto.maximo_bytes').executeTakeFirst())?.valor),
    list: (id: number, internal: boolean) => attachments(id, internal).orderBy('a.fechaSubida').orderBy('a.idAdjunto').execute(),
    find: (id: number, internal: boolean, idAdjunto: number) => attachments(id, internal).where('a.idAdjunto', '=', idAdjunto).executeTakeFirst(),
    insert: async (idTicket: number, context: SessionContext, file: { nombreOriginal: string; nombreAlmacenado: string; mimeType: string; tamanoBytes: number; hashSha256: string }) => {
      const now = new Date();
      const row = await executor.insertInto('ticketAdjuntos').values({ ...file, idTicket, idComentario: null,
        subidoPor: context.usuario.idUsuario, fechaSubida: now, estadoValidacion: 'VALIDO' }).returningAll().executeTakeFirstOrThrow();
      await executor.updateTable('tickets').set({ version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
      await executor.insertInto('bitacora').values({ idTicket, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion,
        accion: 'ADJUNTO', fechaHora: now, automatica: false, direccionIp: context.direccionIp ?? null, hashPrevio: '', hashRegistro: '',
        valorNuevo: { idAdjunto: row.idAdjunto, hashSha256: file.hashSha256, tamanoBytes: file.tamanoBytes } }).execute();
      return row;
    },
  };
}
export type AttachmentsRepository = ReturnType<typeof createAttachmentsRepository>;
export function withAttachmentsTransaction<T>(database: Database, action: (repository: AttachmentsRepository) => Promise<T>) {
  return database.transaction().execute((trx) => action(createAttachmentsRepository(database, trx)));
}
