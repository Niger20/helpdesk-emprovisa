import { calendarSnapshotSchema } from '@helpdesk/contracts';
import type { CalendarSnapshot } from '@helpdesk/contracts';
import type { DatabaseExecutor } from '../../infra/db/client.js';
import type { SessionContext } from '../auth/index.js';

export function createCalendarSlaRepository(executor: DatabaseExecutor) {
  const calendar = async (siteId: number): Promise<CalendarSnapshot> => {
    const row = await executor.selectFrom('sedes as s').innerJoin('calendariosLaborales as c', 'c.idCalendario', 's.idCalendario')
      .select(['c.idCalendario', 'c.zonaHoraria']).where('s.idSede', '=', siteId).where('s.activa', '=', true).forShare().executeTakeFirstOrThrow();
    const horarios = await executor.selectFrom('horariosLaborales').select(['diaSemana', 'horaInicio', 'horaFin']).where('idCalendario', '=', row.idCalendario).orderBy('diaSemana').orderBy('horaInicio').execute();
    const feriados = await executor.selectFrom('feriados').select('fecha').where('idCalendario', '=', row.idCalendario).orderBy('fecha').execute();
    return calendarSnapshotSchema.parse({ zonaHoraria: row.zonaHoraria, horarios: horarios.map((hour) => ({ ...hour, horaInicio: hour.horaInicio.slice(0, 5), horaFin: hour.horaFin.slice(0, 5) })), feriados: feriados.map((day) => day.fecha) });
  };
  return { calendar,
    cycleCalendar: async (idTicket: number, cycle: number, idSede: number) => {
      const row = await executor.selectFrom('bitacora').select('valorNuevo').where('idTicket', '=', idTicket).where('accion', '=', 'SLA_CALENDARIO_FIJADO')
        .where('valorNuevo', '@>', JSON.stringify({ ciclo: cycle })).orderBy('idBitacora', 'desc').executeTakeFirst();
      if (!row) return calendar(idSede);
      if (!row.valorNuevo || typeof row.valorNuevo !== 'object' || Array.isArray(row.valorNuevo)) throw new Error('Snapshot de calendario inválido.');
      return calendarSnapshotSchema.parse(row.valorNuevo.calendario);
    },
    recordCalendar: (idTicket: number, cycle: number, snapshot: CalendarSnapshot, now: Date, context: SessionContext | null, idTarea: number | null = null) => executor.insertInto('bitacora')
      .values({ idTicket, accion: 'SLA_CALENDARIO_FIJADO', campoAfectado: 'calendario_sla', valorNuevo: { ciclo: cycle, calendario: calendarSnapshotSchema.parse(snapshot) },
        fechaHora: now, idUsuario: context?.usuario.idUsuario ?? null, idSesion: context?.idSesion ?? null, direccionIp: context?.direccionIp ?? null,
        automatica: context === null, idTarea, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
