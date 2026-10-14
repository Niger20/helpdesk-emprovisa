import type { DateTime } from 'luxon';
import type { SeedTransaction } from './context.js';
import type { TicketScenario } from './ticket-scenarios.js';

export async function seedTicketHistory(trx: SeedTransaction, id: number, scenario: TicketScenario, created: DateTime, now: Date) {
  const current = scenario.camino.at(-1);
  const analyst = scenario.sede === 1 ? 5 : scenario.sede === 2 ? 8 : 9;
  const group = scenario.sede === 1 ? 1 : scenario.sede === 2 ? 3 : 4;
  for (const [step, estado] of scenario.camino.entries()) {
    const actor = ['CERRADO', 'REABIERTO', 'CANCELADO'].includes(estado) ? scenario.solicitante : step === 0 ? scenario.solicitante : [4, 8].includes(id) || estado === 'ESCALADO' ? 6 : analyst;
    await trx.insertInto('bitacora').values({
      idTicket: id, idUsuario: id === 5 && step === 0 ? analyst : actor,
      accion: step === 0 ? 'CREACION' : 'CAMBIO_ESTADO', campoAfectado: 'id_estado',
      valorAnterior: step ? { estado: scenario.camino[step - 1] } : null, valorNuevo: { estado },
      fechaHora: estado === 'REABIERTO' ? now : created.plus({ minutes: step * 15 }).toJSDate(),
      direccionIp: '127.0.0.1', automatica: false, hashPrevio: '', hashRegistro: '',
    }).execute();
  }
  if (scenario.camino.includes('ASIGNADO')) {
    await trx.insertInto('ticketAsignaciones').values({
      idTicket: id, idUsuario: [4, 8].includes(id) ? 6 : analyst, idGrupo: [4, 8].includes(id) ? 2 : group,
      tipo: 'MANUAL', asignadoPor: 1, motivo: 'Asignación de demostración', desde: created.plus({ minutes: 15 }).toJSDate(),
      hasta: current === 'ESCALADO' ? created.plus({ minutes: 30 }).toJSDate() : null,
    }).execute();
  }
  if (current === 'EN_ESPERA') {
    await trx.insertInto('pausasSla').values({
      idTicket: id, motivo: 'REPUESTOS', detalle: 'Pendiente de rodillo de alimentación (demo)',
      iniciadaPor: 6, aprobadaPor: 1, inicio: created.plus({ minutes: 45 }).toJSDate(),
    }).execute();
  }
  if (current === 'ESCALADO') {
    await trx.insertInto('ticketEscalamientos').values({
      idTicket: id, nivelOrigen: 1, nivelDestino: 2, idGrupoDestino: 2, tipo: 'MANUAL',
      motivo: 'Diagnóstico de red y energía del CCTV (demo)', escaladoPor: analyst, fecha: created.plus({ minutes: 30 }).toJSDate(),
    }).execute();
    await trx.insertInto('ticketAsignaciones').values({
      idTicket: id, idUsuario: 6, idGrupo: 2, tipo: 'ESCALAMIENTO', asignadoPor: analyst,
      motivo: 'Asignación al grupo especialista (demo)', desde: created.plus({ minutes: 30 }).toJSDate(),
    }).execute();
  }
  if (scenario.camino.includes('RESUELTO')) {
    await trx.insertInto('ticketResoluciones').values({
      idTicket: id, ciclo: 1, idResolutor: id === 8 ? 6 : analyst,
      causa: 'Configuración de demostración', solucion: 'Se verificó conectividad y se probó el servicio con el solicitante.',
      fechaResolucion: created.plus({ minutes: 45 }).toJSDate(),
    }).execute();
  }
  if (current === 'REABIERTO') {
    await trx.insertInto('ticketReaperturas').values({
      idTicket: id, solicitadaPor: scenario.solicitante, motivo: 'Volvieron los cortes de imagen (demo)', fecha: now,
      nuevoLimiteSolucion: new Date(now.getTime() + 120 * 60_000),
    }).execute();
  }
  await trx.insertInto('ticketComentarios').values([
    { idTicket: id, idAutor: scenario.solicitante, visibilidad: 'PUBLICO', contenido: 'El caso afecta la operación descrita. Datos ficticios de demostración.', origen: 'PORTAL', fechaCreacion: created.toJSDate() },
  ]).execute();
  if (current !== 'NUEVO') await trx.insertInto('ticketComentarios').values({
    idTicket: id, idAutor: analyst, visibilidad: 'INTERNO', contenido: 'Nota técnica de demostración; debe filtrarse para el solicitante.', origen: 'PORTAL', fechaCreacion: created.plus({ minutes: 5 }).toJSDate(),
  }).execute();
}
