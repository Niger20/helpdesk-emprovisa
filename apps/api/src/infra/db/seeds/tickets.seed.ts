import { estadoTicketSchema } from '@helpdesk/contracts';
import { DateTime } from 'luxon';
import type { SeedTransaction } from './context.js';
import { scenarios } from './ticket-scenarios.js';
import { seedTicketHistory } from './ticket-history.seed.js';

export async function seedTickets(trx: SeedTransaction, now: Date) {
  const monday = DateTime.fromJSDate(now).setZone('America/Managua').startOf('week').set({ hour: 8 });
  for (const [index, scenario] of scenarios.entries()) {
    const id = index + 1;
    const created = scenario.antiguedadMinutos === null ? monday : DateTime.fromJSDate(now).minus({ minutes: scenario.antiguedadMinutos });
    const current = scenario.camino.at(-1) ?? 'NUEVO';
    const reopened = current === 'REABIERTO';
    const closed = current === 'CERRADO';
    const resolved = current === 'RESUELTO' || closed;
    const firstReply = scenario.camino.includes('EN_ATENCION') ? created.plus({ minutes: 15 }).toJSDate() : null;
    const responseMinutes = [15, 30, 120, 240][scenario.prioridad - 1] ?? 120;
    const solutionMinutes = [120, 240, 480, 1440][scenario.prioridad - 1] ?? 480;
    const cycleStart = reopened ? DateTime.fromJSDate(now) : created;
    const solutionLimit = scenario.prioridad === 4
      ? monday.plus({ days: 2, hours: 6 }) : cycleStart.plus({ minutes: solutionMinutes });
    const analyst = scenario.sede === 1 ? 5 : scenario.sede === 2 ? 8 : 9;
    const group = scenario.sede === 1 ? 1 : scenario.sede === 2 ? 3 : 4;
    await trx.insertInto('tickets').values({
      idTicket: id, numero: scenario.numero, titulo: scenario.titulo,
      descripcion: `Caso simulado para demostrar ${current.replaceAll('_', ' ').toLowerCase()} en ${scenario.sede === 1 ? 'Managua' : scenario.sede === 2 ? 'Rivas' : 'León'}.`,
      tipo: scenario.categoria === 2 ? 'SOLICITUD' : 'INCIDENTE',
      idSolicitante: scenario.solicitante, idRegistradoPor: id === 5 ? analyst : scenario.solicitante,
      idAsignado: ['NUEVO', 'CANCELADO'].includes(current) ? null : [4, 5, 8].includes(id) ? 6 : analyst,
      idGrupo: [4, 5, 8].includes(id) ? 2 : group, idSede: scenario.sede, idCategoria: scenario.categoria,
      idActivo: scenario.activo, impacto: scenario.prioridad <= 2 ? 'ALTO' : scenario.prioridad === 3 ? 'MEDIO' : 'BAJO',
      urgencia: scenario.prioridad === 1 ? 'ALTA' : 'MEDIA', idPrioridad: scenario.prioridad,
      prioridadManual: false, idEstado: estadoTicketSchema.options.indexOf(current) + 1,
      canalIngreso: id === 5 ? 'TELEFONO' : 'PORTAL', numeroReaperturas: reopened ? 1 : 0,
      fechaCreacion: created.toJSDate(), fechaLimiteRespuesta: cycleStart.plus({ minutes: responseMinutes }).toJSDate(),
      fechaLimiteSolucion: solutionLimit.toJSDate(), fechaPrimeraRespuesta: reopened ? null : firstReply,
      fechaResolucion: resolved ? created.plus({ minutes: 45 }).toJSDate() : null,
      fechaCierre: closed ? created.plus({ minutes: 60 }).toJSDate() : null,
      minutosPausa: 0, slaRespuestaCumplido: resolved ? true : null, slaSolucionCumplido: resolved ? true : null, version: scenario.camino.length,
    }).execute();
    await seedTicketHistory(trx, id, scenario, created, now);
  }
}
