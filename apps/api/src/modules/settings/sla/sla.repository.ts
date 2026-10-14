import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { z } from 'zod';
import type { prioridadSchema } from '@helpdesk/contracts';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

function queries(executor: Database | Transaction<DB>) {
  return {
    read: async () => ({
      prioridades: await executor.selectFrom('prioridadesSla').selectAll().orderBy('codigo').execute(),
      matriz: await executor.selectFrom('matrizPrioridad as m').innerJoin('prioridadesSla as p', 'p.idPrioridad', 'm.idPrioridad')
        .select(['m.impacto', 'm.urgencia', 'p.codigo as prioridad']).orderBy('m.impacto').orderBy('m.urgencia').execute(),
    }),
    rename: (codigo: z.infer<typeof prioridadSchema>, nombre: string) => executor.updateTable('prioridadesSla').set({ nombre }).where('codigo', '=', codigo).executeTakeFirstOrThrow(),
    audit: (codigo: string, anterior: string, nuevo: string, context: SessionContext, now: Date) => executor.insertInto('auditoriaSistema')
      .values({ entidad: 'prioridades_sla', idEntidad: codigo, accion: 'SLA_NOMBRE_EDITADO', idUsuario: context.usuario.idUsuario,
        idSesion: context.idSesion, direccionIp: context.direccionIp ?? null, detalle: { codigo, anterior, nuevo },
        resultado: 'EXITO', fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
export function createSlaSettingsRepository(database: Database) {
  return { atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) => database.transaction().execute(async (trx) => {
    await sql`select pg_advisory_xact_lock(2026023, 1)`.execute(trx);
    await trx.selectFrom('prioridadesSla').select('idPrioridad').orderBy('idPrioridad').forUpdate().execute();
    await trx.selectFrom('matrizPrioridad').select('idMatriz').orderBy('idMatriz').forUpdate().execute();
    return action(queries(trx));
  }) };
}
export type SlaSettingsRepository = ReturnType<typeof createSlaSettingsRepository>;
export type SlaSettingsRows = Awaited<ReturnType<ReturnType<typeof queries>['read']>>;
