import type { Transaction } from 'kysely';
import type { RoleAssignment } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import { createIdentitySecurityService } from '../users/index.js';

function queries(executor: Database | Transaction<DB>) {
  return {
    security: createIdentitySecurityService(executor),
    user: (id: number) => executor.selectFrom('usuarios').select(['idUsuario', 'idSede', 'estado']).where('idUsuario', '=', id).executeTakeFirst(),
    site: (id: number) => executor.selectFrom('sedes').select('idSede').where('idSede', '=', id).where('activa', '=', true).executeTakeFirst(),
    catalog: async () => {
      const roles = await executor.selectFrom('roles').select(['idRol', 'codigo', 'nombre', 'esSistema']).orderBy('nombre').execute();
      const grants = await executor.selectFrom('rolPermiso as rp').innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select(['rp.idRol', 'p.codigo']).execute();
      return roles.map((role) => ({ ...role, permisos: grants.filter((grant) => grant.idRol === role.idRol).map((grant) => grant.codigo) }));
    },
    links: (id: number) => executor.selectFrom('usuarioRol as ur').innerJoin('roles as r', 'r.idRol', 'ur.idRol')
      .selectAll('ur').select(['r.nombre', 'r.codigo']).where('ur.idUsuario', '=', id).orderBy('ur.idUsuarioRol').execute(),
    findLink: (id: number) => executor.selectFrom('usuarioRol').selectAll().where('idUsuarioRol', '=', id).executeTakeFirst(),
    overlap: (id: number, input: RoleAssignment, exceptId?: number) => {
      let builder = executor.selectFrom('usuarioRol').select('idUsuarioRol').where('idUsuario', '=', id)
        .where('idRol', '=', input.idRol).where('idSedeAlcance', input.idSedeAlcance === null ? 'is' : '=', input.idSedeAlcance)
        .where((eb) => eb.or([eb('vigenteHasta', 'is', null), eb('vigenteHasta', '>=', input.vigenteDesde)]))
        .where('vigenteDesde', '<=', input.vigenteHasta ?? '9999-12-31');
      if (exceptId !== undefined) builder = builder.where('idUsuarioRol', '!=', exceptId);
      return builder.executeTakeFirst();
    },
    insert: (id: number, input: RoleAssignment, asignadoPor: number) => executor.insertInto('usuarioRol').values({ ...input, idUsuario: id, asignadoPor })
      .returning('idUsuarioRol').executeTakeFirstOrThrow(),
    edit: async (id: number, input: RoleAssignment, asignadoPor: number) => { await executor.updateTable('usuarioRol').set({ ...input, asignadoPor }).where('idUsuarioRol', '=', id).execute(); },
    remove: async (id: number) => { await executor.deleteFrom('usuarioRol').where('idUsuarioRol', '=', id).execute(); },
  };
}
export function createRbacRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repository: ReturnType<typeof queries>) => Promise<T>) =>
    database.transaction().execute(async (trx) => { const repo = queries(trx); await repo.security.lock(); return action(repo); }) };
}
export type RbacRepository = ReturnType<typeof createRbacRepository>;
