import type { Transaction } from 'kysely';
import type { SurveyResponse } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';

export type SurveyExecutor = Database | Transaction<DB>;
export function createSurveyQueries(executor: SurveyExecutor) {
  return {
    lockTicket: (idTicket: number) => executor.selectFrom('tickets as t')
      .innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado').select(['t.idTicket', 'e.codigo'])
      .where('t.idTicket', '=', idTicket).forUpdate('t').executeTakeFirst(),
    existing: (idTicket: number) => executor.selectFrom('encuestasCsat').select('idEncuesta')
      .where('idTicket', '=', idTicket).executeTakeFirst(),
    insert: async (idTicket: number, tokenHash: string, now: Date, expires: Date) => {
      await executor.insertInto('encuestasCsat').values({ idTicket, tokenHash, enviadaEn: now, expiraEn: expires,
        calificacion: null, comentario: null, respondidaEn: null }).execute();
    },
    find: (hash: string) => executor.selectFrom('encuestasCsat as s').innerJoin('tickets as t', 't.idTicket', 's.idTicket')
      .innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado').leftJoin('usuarios as u', 'u.idUsuario', 't.idAsignado')
      .select(['s.expiraEn', 's.respondidaEn', 't.numero', 't.titulo', 't.fechaCierre', 'e.codigo', 'u.nombreCompleto as atendidoPor'])
      .where('s.tokenHash', '=', hash).executeTakeFirst(),
    answer: (hash: string, input: SurveyResponse, now: Date) => executor.updateTable('encuestasCsat')
      .set({ calificacion: input.calificacion, comentario: input.comentario || null, respondidaEn: now })
      .where('tokenHash', '=', hash).where('respondidaEn', 'is', null).where('expiraEn', '>', now)
      .where('idTicket', 'in', executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
        .select('t.idTicket').where('e.codigo', '=', 'CERRADO'))
      .returning(['idEncuesta', 'idTicket']).executeTakeFirst(),
    auditResponse: async (idEncuesta: number, idTicket: number, calificacion: number, now: Date, ip?: string) => {
      await executor.insertInto('auditoriaSistema').values({ entidad: 'encuestas_csat', idEntidad: String(idEncuesta),
        accion: 'CSAT_RESPONDIDA', fechaHora: now, resultado: 'EXITO', idUsuario: null, idSesion: null,
        direccionIp: ip ?? null, detalle: { idTicket, calificacion }, hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
export function createSurveysRepository(database: Database) {
  return { ...createSurveyQueries(database), atomic: <T>(action: (queries: ReturnType<typeof createSurveyQueries>) => Promise<T>) =>
    database.transaction().execute((trx) => action(createSurveyQueries(trx))) };
}
export type SurveysRepository = ReturnType<typeof createSurveysRepository>;
export type SurveyRow = NonNullable<Awaited<ReturnType<SurveysRepository['find']>>>;
