import { sql } from 'kysely';
import type { Transaction, Updateable } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';

export function createLifecycleRepository(executor: Database | Transaction<DB>) {
  return {
    lifecycleUpdate: (idTicket: number, changes: Updateable<DB['tickets']>) => executor.updateTable('tickets')
      .set({ ...changes, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute(),
    lifecyclePriority: (idPrioridad: number) => executor.selectFrom('prioridadesSla').selectAll().where('idPrioridad', '=', idPrioridad).executeTakeFirstOrThrow(),
    manualPriority: (codigo: string) => executor.selectFrom('prioridadesSla').selectAll().where('codigo', '=', codigo).where('activa', '=', true).executeTakeFirst(),
    lifecycleGroups: (idSede: number) => executor.selectFrom('gruposResolutores').selectAll().where('activo', '=', true).where('nivel', '=', 2)
      .where((eb) => eb.or([eb('idSede', '=', idSede), eb('idSede', 'is', null)])).orderBy('nombre').execute(),
    lifecycleGroup: (idGrupo: number) => executor.selectFrom('gruposResolutores').selectAll().where('idGrupo', '=', idGrupo).where('activo', '=', true).executeTakeFirst(),
    lifecycleCatalog: async (idSede: number, tipo: string) => ({
      categorias: await executor.selectFrom('categorias').select(['idCategoria', 'nombre']).where('activa', '=', true).where('tipoAplicable', 'in', [tipo, 'AMBOS']).execute(),
      activos: await executor.selectFrom('activosTi').select(['idActivo', 'codigoPatrimonial']).where('idSede', '=', idSede).where('estado', '!=', 'BAJA').execute(),
    }),
    lifecycleAlerts: async (idTicket: number, cicloSla: number, when: Date | null) => {
      await executor.deleteFrom('slaAlertas').where('idTicket', '=', idTicket).where('estado', '=', 'PENDIENTE').execute();
      const fired = await executor.selectFrom('slaAlertas').select('idAlerta').where('idTicket', '=', idTicket).where('cicloSla', '=', cicloSla)
        .where('tipo', '=', 'UMBRAL_50').where('estado', '!=', 'PENDIENTE').executeTakeFirst();
      if (when && !fired) await executor.insertInto('slaAlertas').values({ idTicket, cicloSla, tipo: 'UMBRAL_50', estado: 'PENDIENTE', programadaPara: when }).execute();
    },
  };
}
