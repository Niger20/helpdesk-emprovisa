import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { JsonValue } from '../../infra/db/generated/helpers.js';
import type { SessionContext } from '../auth/index.js';

export type IdentityExecutor = Database | Transaction<DB>;
export function createIdentitySecurityRepository(executor: IdentityExecutor) {
  return {
    lock: async () => { await sql`select pg_advisory_xact_lock(2026018, 1)`.execute(executor); },
    administrators: async (today: string, now: Date) => {
      const rows = await executor.selectFrom('usuarios as u').innerJoin('sedes as s', 's.idSede', 'u.idSede').where('s.activa', '=', true)
        .innerJoin('usuarioRol as ur', 'ur.idUsuario', 'u.idUsuario')
        .innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol').innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso')
        .select(['u.idUsuario', 'p.codigo']).where('u.estado', '=', 'ACTIVO').where('u.origenCuenta', '=', 'LOCAL')
        .where('u.passwordHash', 'is not', null).where((eb) => eb.or([eb('u.bloqueadoHasta', 'is', null), eb('u.bloqueadoHasta', '<=', now)]))
        .where('ur.idSedeAlcance', 'is', null).where('ur.vigenteDesde', '<=', today).where('ur.vigenteHasta', 'is', null)
        .where('p.codigo', 'in', ['usuario.administrar', 'rol.administrar']).execute();
      const grouped = new Map<number, Set<string>>();
      for (const row of rows) { const set = grouped.get(row.idUsuario) ?? new Set<string>(); set.add(row.codigo); grouped.set(row.idUsuario, set); }
      return [...grouped].filter(([, codes]) => codes.size === 2).map(([id]) => id);
    },
    revoke: async (idUsuario: number, now: Date) => {
      await executor.updateTable('sesiones').set({ revocadaEn: now, motivoRevocacion: 'ADMINISTRACION_ACCESO' })
        .where('idUsuario', '=', idUsuario).where('revocadaEn', 'is', null).execute();
    },
    audit: async (context: SessionContext, accion: string, entidad: string, idEntidad: number, detalle: Record<string, JsonValue>, now: Date) => {
      await executor.insertInto('auditoriaSistema').values({ idUsuario: context.usuario.idUsuario, idSesion: context.idSesion,
        accion, entidad, idEntidad: String(idEntidad), detalle, fechaHora: now, direccionIp: context.direccionIp ?? null,
        resultado: 'EXITO', hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
