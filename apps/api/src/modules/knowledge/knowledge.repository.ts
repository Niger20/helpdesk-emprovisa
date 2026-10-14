import type { Transaction } from 'kysely';
import type { KnowledgeCreate, KnowledgeQuery } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { SessionContext } from '../auth/index.js';
import type { KnowledgeAccess } from './knowledge.policies.js';

function createQueries(executor: Database | Transaction<DB>) {
  const base = () => executor.selectFrom('articulosKb as a').innerJoin('categorias as c', 'c.idCategoria', 'a.idCategoria')
    .innerJoin('usuarios as u', 'u.idUsuario', 'a.idAutor').leftJoin('usuarios as r', 'r.idUsuario', 'a.idRevisor')
    .selectAll('a').select(['c.nombre as categoria', 'u.nombreCompleto as autor', 'r.nombreCompleto as revisor']);
  const visible = (access: KnowledgeAccess) => {
    let builder = base();
    if (!access.editorial) builder = builder.where('a.estado', '=', 'PUBLICADO');
    if (!access.internal) builder = builder.where('a.visibilidad', '=', 'PUBLICO');
    return builder;
  };
  const filtered = (input: KnowledgeQuery, access: KnowledgeAccess) => {
    let builder = visible(access);
    if (input.idCategoria) builder = builder.where('a.idCategoria', '=', input.idCategoria);
    if (input.estado) builder = builder.where('a.estado', '=', input.estado);
    if (input.q) {
      const pattern = `%${input.q.replace(/[\\%_]/g, '\\$&')}%`;
      builder = builder.where((eb) => eb.or([eb('a.titulo', 'ilike', pattern), eb('a.resumen', 'ilike', pattern), eb('a.contenido', 'ilike', pattern)]));
    }
    return builder;
  };
  const articleValues = (input: KnowledgeCreate, context: SessionContext, now: Date) => ({
    titulo: input.titulo, resumen: input.resumen, contenido: input.contenido, idCategoria: input.idCategoria,
    estado: input.estado, visibilidad: input.visibilidad,
    idRevisor: input.estado === 'PUBLICADO' ? context.usuario.idUsuario : null,
    publicadoEn: input.estado === 'PUBLICADO' ? now : null,
  });
  return {
    list: async (input: KnowledgeQuery, access: KnowledgeAccess) => {
      const column = input.sort.includes('titulo') ? 'a.titulo' : 'a.publicadoEn';
      const rows = await filtered(input, access).orderBy(column, input.sort.startsWith('-') ? 'desc' : 'asc')
        .orderBy('a.idArticulo', 'desc').limit(input.pageSize).offset((input.page - 1) * input.pageSize).execute();
      const count = await filtered(input, access).clearSelect().select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      return { rows, total: Number(count.total) };
    },
    find: (id: number, access: KnowledgeAccess) => visible(access).where('a.idArticulo', '=', id).executeTakeFirst(),
    lock: (id: number) => executor.selectFrom('articulosKb').selectAll().where('idArticulo', '=', id).forUpdate().executeTakeFirst(),
    category: (id: number) => executor.selectFrom('categorias').select('idCategoria').where('idCategoria', '=', id).where('activa', '=', true).executeTakeFirst(),
    catalogs: async () => ({ categorias: await executor.selectFrom('categorias').select(['idCategoria', 'nombre']).where('activa', '=', true).orderBy('orden').orderBy('nombre').execute() }),
    versions: (id: number) => executor.selectFrom('articulosKbVersiones as v').innerJoin('usuarios as u', 'u.idUsuario', 'v.editadoPor')
      .select(['v.numeroVersion', 'v.titulo', 'v.contenido', 'v.fechaEdicion', 'v.motivoCambio', 'u.nombreCompleto as editadoPor'])
      .where('v.idArticulo', '=', id).orderBy('v.numeroVersion', 'desc').execute(),
    insert: (input: KnowledgeCreate, context: SessionContext, now: Date) => executor.insertInto('articulosKb')
      .values({ ...articleValues(input, context, now), idAutor: context.usuario.idUsuario, versionActual: 1, totalVistas: 0 })
      .returning('idArticulo').executeTakeFirstOrThrow(),
    update: async (id: number, input: KnowledgeCreate, context: SessionContext, version: number, now: Date) => {
      await executor.updateTable('articulosKb').set({ ...articleValues(input, context, now), versionActual: version }).where('idArticulo', '=', id).execute();
    },
    version: async (id: number, input: KnowledgeCreate, context: SessionContext, version: number, now: Date) => {
      await executor.insertInto('articulosKbVersiones').values({ idArticulo: id, numeroVersion: version, titulo: input.titulo,
        contenido: input.contenido, editadoPor: context.usuario.idUsuario, fechaEdicion: now, motivoCambio: input.motivoCambio }).execute();
    },
    audit: async (id: number, context: SessionContext, version: number, now: Date) => {
      await executor.insertInto('auditoriaSistema').values({ entidad: 'articulos_kb', idEntidad: String(id),
        accion: version === 1 ? 'KB_CREADO' : 'KB_EDITADO', idUsuario: context.usuario.idUsuario, idSesion: context.idSesion,
        fechaHora: now, resultado: 'EXITO', detalle: { versionActual: version }, hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
export function createKnowledgeRepository(database: Database) {
  return { ...createQueries(database), atomic: <T>(action: (queries: ReturnType<typeof createQueries>) => Promise<T>) =>
    database.transaction().execute((trx) => action(createQueries(trx))) };
}
export type KnowledgeRepository = ReturnType<typeof createKnowledgeRepository>;
export type KnowledgeRow = NonNullable<Awaited<ReturnType<KnowledgeRepository['find']>>>;
