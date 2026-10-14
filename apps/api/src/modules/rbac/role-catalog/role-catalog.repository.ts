import type { Transaction } from 'kysely';
import type { RoleCatalogInput } from '@helpdesk/contracts';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import { createIdentitySecurityService } from '../../users/index.js';

function queries(executor: Database | Transaction<DB>) {
  return {
    security: createIdentitySecurityService(executor),
    roles: () => executor.selectFrom('roles').selectAll().orderBy('nombre').execute(),
    permissions: () => executor.selectFrom('permisos').selectAll().orderBy('codigo').execute(),
    grants: () => executor.selectFrom('rolPermiso as rp').innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso')
      .select(['rp.idRol', 'p.codigo']).execute(),
    affected: (idRol: number, today: string) => executor.selectFrom('usuarioRol as ur').innerJoin('usuarios as u', 'u.idUsuario', 'ur.idUsuario')
      .innerJoin('sedes as s', 's.idSede', 'u.idSede').select(['u.idUsuario', 'u.idSede', 'ur.idSedeAlcance', 's.activa'])
      .where('ur.idRol', '=', idRol).where((eb) => eb.or([eb('ur.vigenteHasta', 'is', null), eb('ur.vigenteHasta', '>=', today)])).execute(),
    actorGrants: (idUsuario: number, idSesion: string, today: string, now: Date) => executor.selectFrom('usuarioRol as ur')
      .innerJoin('usuarios as u', 'u.idUsuario', 'ur.idUsuario').innerJoin('sedes as s', 's.idSede', 'u.idSede')
      .innerJoin('sesiones as se', 'se.idUsuario', 'u.idUsuario').innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol')
      .innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select(['p.codigo', 'ur.idSedeAlcance'])
      .where('u.idUsuario', '=', idUsuario).where('u.estado', '=', 'ACTIVO').where('s.activa', '=', true)
      .where('se.idSesion', '=', idSesion).where('se.revocadaEn', 'is', null).where('se.expiraEn', '>', now)
      .where('ur.vigenteDesde', '<=', today).where((eb) => eb.or([eb('ur.vigenteHasta', 'is', null), eb('ur.vigenteHasta', '>=', today)]))
      .where((eb) => eb.or([eb('ur.idSedeAlcance', 'is', null), eb('ur.idSedeAlcance', '=', eb.ref('u.idSede'))])).execute(),
    insert: (data: RoleCatalogInput) => executor.insertInto('roles').values({ codigo: data.codigo, nombre: data.nombre,
      descripcion: data.descripcion, esSistema: false }).returning('idRol').executeTakeFirstOrThrow(),
    edit: async (idRol: number, data: RoleCatalogInput) => { await executor.updateTable('roles').set({ codigo: data.codigo,
      nombre: data.nombre, descripcion: data.descripcion }).where('idRol', '=', idRol).where('esSistema', '=', false).execute(); },
    replace: async (idRol: number, ids: number[]) => {
      await executor.deleteFrom('rolPermiso').where('idRol', '=', idRol).execute();
      await executor.insertInto('rolPermiso').values(ids.map((idPermiso) => ({ idRol, idPermiso }))).execute();
    },
  };
}
export function createRoleCatalogRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) =>
    database.transaction().execute(async (trx) => { const repo = queries(trx); await repo.security.lock(); return action(repo); }) };
}
export type RoleCatalogRepository = ReturnType<typeof createRoleCatalogRepository>;
