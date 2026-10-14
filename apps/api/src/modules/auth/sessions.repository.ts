import { DateTime } from 'luxon';
import type { Database } from '../../infra/db/client.js';
import type { Transaction } from 'kysely';
import type { DB } from '../../infra/db/generated-types.js';
import type { LoginMetadata } from './auth.types.js';

export function createSessionsRepository(database: Database | Transaction<DB>) {
  return {
    profile: async (idUsuario: number, now: Date) => {
      const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
      const user = await database.selectFrom('usuarios').innerJoin('sedes', 'sedes.idSede', 'usuarios.idSede')
        .select(['usuarios.idUsuario', 'usuarios.username', 'usuarios.nombreCompleto', 'sedes.idSede', 'sedes.codigo', 'sedes.nombre'])
        .where('usuarios.idUsuario', '=', idUsuario).where('usuarios.estado', '=', 'ACTIVO').where('sedes.activa', '=', true).executeTakeFirst();
      if (!user) return null;
      const roles = await database.selectFrom('usuarioRol').innerJoin('roles', 'roles.idRol', 'usuarioRol.idRol')
        .select(['roles.codigo', 'usuarioRol.idSedeAlcance', 'roles.idRol'])
        .where('usuarioRol.idUsuario', '=', idUsuario).where('usuarioRol.vigenteDesde', '<=', date)
        .where((eb) => eb.or([eb('usuarioRol.vigenteHasta', 'is', null), eb('usuarioRol.vigenteHasta', '>=', date)]))
        .where((eb) => eb.or([eb('usuarioRol.idSedeAlcance', 'is', null), eb('usuarioRol.idSedeAlcance', '=', user.idSede)])).execute();
      const permissions = roles.length ? await database.selectFrom('rolPermiso').innerJoin('permisos', 'permisos.idPermiso', 'rolPermiso.idPermiso')
        .select(['permisos.codigo', 'rolPermiso.idRol']).distinct().where('rolPermiso.idRol', 'in', roles.map((role) => role.idRol)).execute() : [];
      return { user, roles, permissions };
    },
    find: (hash: string) => database.selectFrom('sesiones').selectAll().where('tokenHash', '=', hash).executeTakeFirst(),
    insert: async (idSesion: string, idUsuario: number, hash: string, metadata: LoginMetadata, now: Date, expiraEn: Date) => {
      await database.insertInto('sesiones').values({ idSesion, idUsuario, tokenHash: hash,
        direccionIp: metadata.direccionIp, userAgent: metadata.userAgent?.slice(0, 255) ?? null,
        creadaEn: now, ultimaActividad: now, expiraEn }).execute();
    },
    touch: (idSesion: string, now: Date, expiry: Date) => database.updateTable('sesiones')
      .set({ ultimaActividad: now, expiraEn: expiry }).where('idSesion', '=', idSesion)
      .where('revocadaEn', 'is', null).where('expiraEn', '>', now).returning('idSesion').executeTakeFirst(),
    revoke: async (idSesion: string, now: Date, motivo: string) => {
      await database.updateTable('sesiones').set({ revocadaEn: now, motivoRevocacion: motivo })
        .where('idSesion', '=', idSesion).where('revocadaEn', 'is', null).execute();
    },
  };
}
export type SessionsRepository = ReturnType<typeof createSessionsRepository>;
