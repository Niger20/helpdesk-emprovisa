import { sql } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { Transaction } from 'kysely';
import type { DB } from '../../infra/db/generated-types.js';
import type { JobCode } from '@helpdesk/contracts';
import { jobCodeSchema } from '@helpdesk/contracts';
import { createJobsTicketsRepository } from './jobs-tickets.repository.js';

export function createJobsRepository(executor: Database | Transaction<DB>) {
  return {
    executor,
    ...createJobsTicketsRepository(executor),
    task: (codigo: JobCode) => executor.selectFrom('tareasProgramadas').selectAll().where('codigo', '=', codigo).forUpdate().executeTakeFirst(),
    tasks: () => executor.selectFrom('tareasProgramadas').selectAll().where('codigo', 'in', jobCodeSchema.options).orderBy('idTarea').execute(),
    taskResult: (idTarea: number, now: Date, ultimoResultado: string) => executor.updateTable('tareasProgramadas')
      .set({ ultimaEjecucion: now, ultimoResultado }).where('idTarea', '=', idTarea).execute(),
    integrity: async () => {
      const result = await sql<{ valida: boolean }>`select verificar_cadena_bitacora() as valida union all select verificar_cadena_auditoria() as valida`.execute(executor);
      if (result.rows.length !== 2 || result.rows.some((row) => !row.valida)) throw new Error('Integridad de auditoría inválida.');
    },
    log: (idTicket: number, idTarea: number, accion: string, nuevo: Record<string, string | number | null>, now: Date) => executor.insertInto('bitacora')
      .values({ idTicket, idTarea, idUsuario: null, idSesion: null, accion, automatica: true,
        valorNuevo: nuevo, fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
    missingTargetLogged: (idTicket: number, ciclo: number) => executor.selectFrom('bitacora').select('idBitacora').where('idTicket', '=', idTicket)
      .where('accion', '=', 'ALERTA_SLA').where(sql<boolean>`valor_nuevo->>'motivo' = 'SIN_DESTINO_N2' and valor_nuevo->>'ciclo' = ${String(ciclo)}`).executeTakeFirst(),
    notificationsSummary: async () => {
      const counts = await executor.selectFrom('notificaciones').select(['estado', (eb) => eb.fn.countAll().as('total')]).groupBy('estado').execute();
      const count = (estado: string) => Number(counts.find((row) => row.estado === estado)?.total ?? 0);
      return { pendientes: count('PENDIENTE'), enviadas: count('ENVIADA'), fallidas: count('ERROR') };
    },
  };
}
export type JobsRepository = ReturnType<typeof createJobsRepository>;
export const withJobsTransaction = <T>(database: Database, action: (repository: JobsRepository) => Promise<T>) => database.transaction().execute((trx) => action(createJobsRepository(trx)));
