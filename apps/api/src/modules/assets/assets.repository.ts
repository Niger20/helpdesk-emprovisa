import type { Transaction } from 'kysely';
import type { AssetCreate, AssetQuery } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { SessionContext } from '../auth/index.js';
import { createAssetIncidentsRepository } from './assets-incidents.repository.js';

type Executor = Database | Transaction<DB>;
type Scope = number[] | null;

function createAssetQueries(executor: Executor) {
  const base = () => executor.selectFrom('activosTi as a')
    .innerJoin('tiposActivo as t', 't.idTipoActivo', 'a.idTipoActivo').innerJoin('sedes as s', 's.idSede', 'a.idSede')
    .leftJoin('usuarios as u', 'u.idUsuario', 'a.idCustodio').selectAll('a')
    .select(['t.nombre as tipoNombre', 't.familia', 's.nombre as sedeNombre', 'u.nombreCompleto as custodioNombre', 'u.idSede as custodioSede']);
  const filtered = (query: AssetQuery, scope: Scope) => {
    let builder = base();
    if (scope) builder = builder.where('a.idSede', 'in', scope);
    if (query.idSede) builder = builder.where('a.idSede', '=', query.idSede);
    if (query.idTipoActivo) builder = builder.where('a.idTipoActivo', '=', query.idTipoActivo);
    if (query.estado) builder = builder.where('a.estado', '=', query.estado);
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
      builder = builder.where((eb) => eb.or([
        eb('a.codigoPatrimonial', 'ilike', pattern), eb('a.numeroSerie', 'ilike', pattern), eb('a.descripcion', 'ilike', pattern),
        eb('a.marca', 'ilike', pattern), eb('a.modelo', 'ilike', pattern), eb('u.nombreCompleto', 'ilike', pattern),
      ]));
    }
    return builder;
  };
  return {
    ...createAssetIncidentsRepository(executor),
    list: async (query: AssetQuery, scope: Scope) => {
      const rows = await filtered(query, scope).orderBy('a.codigoPatrimonial', query.sort.startsWith('-') ? 'desc' : 'asc')
        .limit(query.pageSize).offset((query.page - 1) * query.pageSize).execute();
      const count = await filtered(query, scope).clearSelect().select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      return { rows, total: Number(count.total) };
    },
    find: (codigo: string) => base().where('a.codigoPatrimonial', '=', codigo).executeTakeFirst(),
    catalogs: async (scope: Scope) => {
      let sedes = executor.selectFrom('sedes').select(['idSede', 'nombre']).where('activa', '=', true);
      let custodios = executor.selectFrom('usuarios').select(['idUsuario', 'nombreCompleto', 'idSede']).where('estado', '=', 'ACTIVO');
      if (scope) { sedes = sedes.where('idSede', 'in', scope); custodios = custodios.where('idSede', 'in', scope); }
      return { sedes: await sedes.orderBy('nombre').execute(), custodios: await custodios.orderBy('nombreCompleto').execute(),
        tiposActivo: await executor.selectFrom('tiposActivo').selectAll().orderBy('nombre').execute() };
    },
    history: (idActivo: number) => executor.selectFrom('activoCustodiaHistorial as h')
      .innerJoin('usuarios as u', 'u.idUsuario', 'h.idUsuario').innerJoin('usuarios as r', 'r.idUsuario', 'h.registradoPor')
      .select(['h.idCustodia', 'h.desde', 'h.hasta', 'h.actaNumero', 'u.nombreCompleto as custodio', 'r.nombreCompleto as registradoPor'])
      .where('h.idActivo', '=', idActivo).orderBy('h.desde', 'desc').orderBy('h.idCustodia', 'desc').execute(),
    references: async (input: AssetCreate) => ({
      tipo: await executor.selectFrom('tiposActivo').select('idTipoActivo').where('idTipoActivo', '=', input.idTipoActivo).executeTakeFirst(),
      sede: await executor.selectFrom('sedes').select('idSede').where('idSede', '=', input.idSede).where('activa', '=', true).executeTakeFirst(),
      custodio: input.idCustodio ? await executor.selectFrom('usuarios').select('idUsuario').where('idUsuario', '=', input.idCustodio)
        .where('estado', '=', 'ACTIVO').executeTakeFirst() : null,
    }),
    insert: (input: AssetCreate) => executor.insertInto('activosTi').values(input).returning('idActivo').executeTakeFirstOrThrow(),
    custody: async (idActivo: number, input: AssetCreate, context: SessionContext, desde: string) => {
      if (input.idCustodio) await executor.insertInto('activoCustodiaHistorial').values({ idActivo, idUsuario: input.idCustodio,
        desde, actaNumero: input.actaNumero, registradoPor: context.usuario.idUsuario }).execute();
    },
    audit: async (idActivo: number, input: AssetCreate, context: SessionContext, now: Date) => {
      await executor.insertInto('auditoriaSistema').values({ accion: 'ACTIVO_CREADO', entidad: 'activos_ti', idEntidad: String(idActivo),
        idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, fechaHora: now, resultado: 'EXITO',
        detalle: { codigoPatrimonial: input.codigoPatrimonial, actaNumero: input.actaNumero, idCustodio: input.idCustodio },
        hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
export function createAssetsRepository(database: Database) {
  return { ...createAssetQueries(database), atomic: <T>(action: (queries: ReturnType<typeof createAssetQueries>) => Promise<T>) =>
    database.transaction().execute((trx) => action(createAssetQueries(trx))) };
}
export type AssetsRepository = ReturnType<typeof createAssetsRepository>;
export type AssetRow = NonNullable<Awaited<ReturnType<AssetsRepository['find']>>>;
