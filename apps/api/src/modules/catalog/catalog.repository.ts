import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { CategoryInput, CategoryQuery } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { SessionContext } from '../auth/index.js';

function queries(executor: Database | Transaction<DB>) {
  const base = () => executor.selectFrom('categorias as c').leftJoin('categorias as p', 'p.idCategoria', 'c.idPadre')
    .leftJoin('gruposResolutores as g', 'g.idGrupo', 'c.idGrupoDefault').selectAll('c').select(['p.nombre as padre', 'g.nombre as grupoDefault']);
  const filtered = (input: CategoryQuery) => {
    let query = base();
    if (input.estado !== 'TODAS') query = query.where('c.activa', '=', input.estado === 'ACTIVAS');
    if (input.q) query = query.where('c.nombre', 'ilike', `%${input.q.replace(/[\\%_]/g, '\\$&')}%`);
    return query;
  };
  return {
    list: async (input: CategoryQuery) => ({ rows: await filtered(input).orderBy('c.orden').orderBy('c.nombre').orderBy('c.idCategoria')
      .limit(input.pageSize).offset((input.page - 1) * input.pageSize).execute(),
    total: Number((await filtered(input).clearSelect().select((eb) => eb.fn.countAll('c').as('total')).executeTakeFirstOrThrow()).total) }),
    find: (id: number) => base().where('c.idCategoria', '=', id).executeTakeFirst(),
    nodes: () => executor.selectFrom('categorias').selectAll().orderBy('idCategoria').forUpdate().execute(),
    group: (id: number) => executor.selectFrom('gruposResolutores').select('idGrupo').where('idGrupo', '=', id).where('activo', '=', true).forShare().executeTakeFirst(),
    referenced: (id: number) => executor.selectFrom('tickets').select('idTicket').where('idCategoria', '=', id).limit(1).executeTakeFirst(),
    insert: (data: CategoryInput) => executor.insertInto('categorias').values(data).returning('idCategoria').executeTakeFirstOrThrow(),
    edit: (id: number, data: CategoryInput) => executor.updateTable('categorias').set(data).where('idCategoria', '=', id).execute(),
    catalogs: async () => ({ categorias: await executor.selectFrom('categorias').selectAll().orderBy('orden').orderBy('nombre').execute(),
      grupos: await executor.selectFrom('gruposResolutores as g').leftJoin('sedes as s', 's.idSede', 'g.idSede')
        .select(['g.idGrupo', 'g.nombre', 'g.nivel', 's.nombre as sede']).where('g.activo', '=', true).orderBy('g.nombre').execute() }),
    audit: (id: number, context: SessionContext, data: CategoryInput, previous: CategoryInput | null, now: Date) => executor.insertInto('auditoriaSistema')
      .values({ entidad: 'categorias', idEntidad: String(id), accion: previous ? 'CATEGORIA_EDITADA' : 'CATEGORIA_CREADA',
        idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, direccionIp: context.direccionIp ?? null,
        detalle: { anterior: previous, nuevo: data }, resultado: 'EXITO', fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
export function createCatalogRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) => database.transaction().execute(async (trx) => {
    await sql`select pg_advisory_xact_lock(2026019, 1)`.execute(trx);
    return action(queries(trx));
  }) };
}
export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
