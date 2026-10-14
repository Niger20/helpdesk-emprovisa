import type { Database, DatabaseExecutor } from '../../infra/db/client.js';
import type { ReportsQuery } from '@helpdesk/contracts';
import { reportDateRange } from './domain/date-range.js';

function queries(db: DatabaseExecutor, query: ReportsQuery, sedes: number[] | null) {
  const range = reportDateRange(query);
  let tickets = db.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
    .innerJoin('prioridadesSla as p', 'p.idPrioridad', 't.idPrioridad').innerJoin('sedes as s', 's.idSede', 't.idSede')
    .innerJoin('categorias as c', 'c.idCategoria', 't.idCategoria').leftJoin('usuarios as u', 'u.idUsuario', 't.idAsignado')
    .leftJoin('encuestasCsat as cs', 'cs.idTicket', 't.idTicket')
    .where('t.fechaCreacion', '>=', range.desde).where('t.fechaCreacion', '<', range.hasta);
  if (sedes !== null) tickets = tickets.where('t.idSede', 'in', sedes.length ? sedes : [-1]);
  if (query.idSede) tickets = tickets.where('t.idSede', '=', query.idSede);
  if (query.idCategoria) tickets = tickets.where('t.idCategoria', '=', query.idCategoria);
  return tickets.select(['t.fechaCreacion', 't.fechaPrimeraRespuesta', 't.fechaResolucion', 't.minutosPausa',
    't.slaSolucionCumplido', 'e.codigo as estado', 'p.codigo as prioridad', 's.nombre as sede', 'c.nombre as categoria',
    'u.nombreCompleto as analista', 'u.idUsuario as idAnalista', 'u.username', 'cs.calificacion', 'cs.respondidaEn']).execute();
}
export function createReportsRepository(database: Database) {
  return {
    snapshot: (query: ReportsQuery, sedes: number[] | null) => database.transaction().setIsolationLevel('repeatable read')
      .execute((transaction) => queries(transaction, query, sedes)),
    catalog: async (sedes: number[] | null) => {
      let sites = database.selectFrom('sedes').select(['idSede', 'nombre']).orderBy('nombre');
      if (sedes !== null) sites = sites.where('idSede', 'in', sedes.length ? sedes : [-1]);
      const [sitesResult, categories] = await Promise.all([sites.execute(), database.selectFrom('categorias').select(['idCategoria', 'nombre']).orderBy('nombre').execute()]);
      return { sedes: sitesResult, categorias: categories };
    },
  };
}
export type ReportsRepository = ReturnType<typeof createReportsRepository>;
export type ReportRow = Awaited<ReturnType<ReportsRepository['snapshot']>>[number];
