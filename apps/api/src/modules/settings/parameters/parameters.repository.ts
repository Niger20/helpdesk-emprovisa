import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { ParameterKey } from '@helpdesk/contracts';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

function queries(executor: Database | Transaction<DB>) {
  return {
    find: (clave: ParameterKey) => executor.selectFrom('parametros').selectAll().where('clave', '=', clave).executeTakeFirst(),
    save: (clave: ParameterKey, valor: number, context: SessionContext, now: Date) => executor.insertInto('parametros')
      .values({ clave, valor: String(valor), tipoDato: 'ENTERO', modificadoPor: context.usuario.idUsuario, modificadoEn: now })
      .onConflict((conflict) => conflict.column('clave').doUpdateSet({ valor: String(valor), tipoDato: 'ENTERO', modificadoPor: context.usuario.idUsuario, modificadoEn: now })).execute(),
    audit: (clave: ParameterKey, anterior: number, nuevo: number, context: SessionContext, now: Date) => executor.insertInto('auditoriaSistema')
      .values({ entidad: 'parametros', idEntidad: clave, accion: 'PARAMETRO_EDITADO', idUsuario: context.usuario.idUsuario,
        idSesion: context.idSesion, direccionIp: context.direccionIp ?? null, detalle: { clave, anterior, nuevo },
        resultado: 'EXITO', fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
export function createParametersRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) => database.transaction().execute(async (trx) => {
    await sql`select pg_advisory_xact_lock(2026021, 1)`.execute(trx);
    return action(queries(trx));
  }) };
}
export type ParametersRepository = ReturnType<typeof createParametersRepository>;
