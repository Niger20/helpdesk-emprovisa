import { sql } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { Transaction } from 'kysely';
import type { DB } from '../../infra/db/generated-types.js';
import { createJobsEscalationRepository } from './jobs-escalation.repository.js';

export function createJobsTicketsRepository(executor: Database | Transaction<DB>) {
  const tickets = () => executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
    .selectAll('t').select('e.codigo as estado');
  return {
    ...createJobsEscalationRepository(executor),
    dueAlerts: (now: Date) => tickets().innerJoin('slaAlertas as a', 'a.idTicket', 't.idTicket').select(['a.idAlerta', 'a.cicloSla'])
      .where('a.estado', '=', 'PENDIENTE').where('a.programadaPara', '<=', now).where('e.relojCorre', '=', true)
      .whereRef('a.cicloSla', '=', sql<number>`t.numero_reaperturas + 1`).orderBy('a.programadaPara').limit(100).forUpdate('t').skipLocked().execute(),
    fireAlert: (idAlerta: number, now: Date) => executor.updateTable('slaAlertas').set({ estado: 'ENVIADA', disparadaEn: now }).where('idAlerta', '=', idAlerta).execute(),
    overdue: (now: Date) => tickets().where('e.relojCorre', '=', true).where('t.fechaPrimeraRespuesta', 'is', null)
      .where('t.fechaLimiteRespuesta', '<=', now).where((eb) => eb.not(eb.exists(eb.selectFrom('bitacora as b').select('b.idBitacora')
        .whereRef('b.idTicket', '=', 't.idTicket').where('b.accion', '=', 'ESCALAMIENTO').where('b.automatica', '=', true)
        .where(sql<boolean>`b.valor_nuevo->>'ciclo' = (t.numero_reaperturas + 1)::text`))))
      .orderBy('t.fechaLimiteRespuesta').limit(100).forUpdate('t').skipLocked().execute(),
    resolved: (now: Date, hours: number) => tickets().where('e.codigo', '=', 'RESUELTO').where('t.fechaResolucion', '<=', new Date(now.getTime() - hours * 3_600_000))
      .where((eb) => eb.not(eb.exists(eb.selectFrom('ticketComentarios as c').select('c.idComentario').whereRef('c.idTicket', '=', 't.idTicket')
        .where('c.fechaCreacion', '>', new Date(now.getTime() - hours * 3_600_000)))))
      .where((eb) => eb.not(eb.exists(eb.selectFrom('bitacora as b').select('b.idBitacora').whereRef('b.idTicket', '=', 't.idTicket')
        .where('b.automatica', '=', false).where('b.fechaHora', '>', new Date(now.getTime() - hours * 3_600_000)))))
      .orderBy('t.fechaResolucion').limit(100).forUpdate('t').skipLocked().execute(),
    close: async (idTicket: number, idEstado: number, now: Date) => {
      await executor.updateTable('tickets').set({ idEstado, fechaCierre: now, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
      await executor.deleteFrom('slaAlertas').where('idTicket', '=', idTicket).where('estado', '=', 'PENDIENTE').execute();
    },
    transition: (idOrigen: number, destino: string) => executor.selectFrom('transicionesEstado as tr').innerJoin('estadosTicket as e', 'e.idEstado', 'tr.idEstadoDestino')
      .select('e.idEstado').where('tr.idEstadoOrigen', '=', idOrigen).where('e.codigo', '=', destino).where('tr.automatica', '=', true).executeTakeFirst(),
    closeHours: async () => Number((await executor.selectFrom('parametros').select('valor').where('clave', '=', 'ticket.cierre_inactividad_horas').executeTakeFirstOrThrow()).valor),
  };
}
