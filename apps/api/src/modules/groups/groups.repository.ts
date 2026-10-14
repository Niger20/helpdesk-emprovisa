import type { Transaction } from 'kysely';
import type { AdminQuery, GroupInput, Membership, Specialty } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import { createIdentitySecurityService } from '../users/index.js';

function queries(executor: Database | Transaction<DB>) {
  const filtered = (query: AdminQuery, scope: number[] | null) => {
    let builder = executor.selectFrom('gruposResolutores').selectAll();
    if (scope) builder = builder.where('idSede', 'in', scope);
    if (query.q) builder = builder.where('nombre', 'ilike', `%${query.q.replace(/[\\%_]/g, '\\$&')}%`);
    return builder;
  };
  return {
    security: createIdentitySecurityService(executor),
    catalogs: async (scope: number[] | null) => {
      let sedes = executor.selectFrom('sedes').select(['idSede', 'nombre']).where('activa', '=', true);
      let usuarios = executor.selectFrom('usuarios').select(['idUsuario', 'idSede', 'nombreCompleto']).where('estado', '=', 'ACTIVO');
      if (scope) { sedes = sedes.where('idSede', 'in', scope); usuarios = usuarios.where('idSede', 'in', scope); }
      return { sedes: await sedes.orderBy('nombre').execute(), usuarios: await usuarios.orderBy('nombreCompleto').execute(), departamentos: [],
        categorias: await executor.selectFrom('categorias').select(['idCategoria', 'nombre']).where('activa', '=', true).orderBy('nombre').execute() };
    },
    list: async (query: AdminQuery, scope: number[] | null) => {
      const rows = await filtered(query, scope).orderBy('nombre').orderBy('idGrupo').limit(query.pageSize).offset((query.page - 1) * query.pageSize).execute();
      const count = await filtered(query, scope).clearSelect().select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      return { rows, total: Number(count.total) };
    },
    find: (id: number) => executor.selectFrom('gruposResolutores').selectAll().where('idGrupo', '=', id).executeTakeFirst(),
    user: (id: number) => executor.selectFrom('usuarios').select(['idUsuario', 'idSede', 'estado']).where('idUsuario', '=', id).executeTakeFirst(),
    site: (id: number) => executor.selectFrom('sedes').innerJoin('calendariosLaborales as c', 'c.idCalendario', 'sedes.idCalendario')
      .select('sedes.idSede').where('sedes.idSede', '=', id).where('sedes.activa', '=', true).executeTakeFirst(),
    category: (id: number) => executor.selectFrom('categorias').select('idCategoria').where('idCategoria', '=', id).where('activa', '=', true).executeTakeFirst(),
    insert: (input: GroupInput) => executor.insertInto('gruposResolutores').values(input).returning('idGrupo').executeTakeFirstOrThrow(),
    edit: async (id: number, input: GroupInput) => { await executor.updateTable('gruposResolutores').set(input).where('idGrupo', '=', id).execute(); },
    members: (id: number) => executor.selectFrom('grupoMiembros as gm').innerJoin('usuarios as u', 'u.idUsuario', 'gm.idUsuario')
      .selectAll('gm').select(['u.nombreCompleto', 'u.idSede']).where('gm.idGrupo', '=', id).orderBy('u.nombreCompleto').execute(),
    member: async (id: number, input: Membership) => { await executor.insertInto('grupoMiembros').values({ idGrupo: id, ...input })
      .onConflict((oc) => oc.columns(['idGrupo', 'idUsuario']).doUpdateSet(input)).execute(); },
    removeMember: async (id: number, idUsuario: number) => { await executor.deleteFrom('grupoMiembros').where('idGrupo', '=', id).where('idUsuario', '=', idUsuario).execute(); },
    specialties: (id: number) => executor.selectFrom('usuarioEspecialidad as ue').innerJoin('categorias as c', 'c.idCategoria', 'ue.idCategoria')
      .select(['ue.idCategoria', 'ue.nivelDominio', 'c.nombre']).where('ue.idUsuario', '=', id).orderBy('c.nombre').execute(),
    specialty: async (id: number, input: Specialty) => { await executor.insertInto('usuarioEspecialidad').values({ idUsuario: id, ...input })
      .onConflict((oc) => oc.columns(['idUsuario', 'idCategoria']).doUpdateSet({ nivelDominio: input.nivelDominio })).execute(); },
    removeSpecialty: async (id: number, idCategoria: number) => { await executor.deleteFrom('usuarioEspecialidad').where('idUsuario', '=', id).where('idCategoria', '=', idCategoria).execute(); },
  };
}
export function createGroupsRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) =>
    database.transaction().execute(async (trx) => { const repo = queries(trx); await repo.security.lock(); return action(repo); }) };
}
export type GroupsRepository = ReturnType<typeof createGroupsRepository>;
