import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { lifecycleTransition, lifecycleStateLog, assertTicketAssignee } from '../lifecycle/lifecycle.service.js';
import { calcularFechasLimiteSla, contarMinutosSla } from '../domain/sla-calculator.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function executePause(repo: TicketsRepository, row: TicketRow, context: SessionContext, input: Extract<TicketLifecycleCommand, { accion: 'pausar' | 'reanudar' }>, now: Date) {
  assertTicketAssignee(context, row);
  if (input.accion === 'pausar') {
    const idEstado = await lifecycleTransition(repo, row, 'EN_ESPERA', context, input.detalle);
    if (await repo.openPause(row.idTicket)) throw new AppError('TRANSICION_INVALIDA', 409, 'El ticket ya tiene una pausa abierta.');
    await repo.beginPause(row.idTicket, input.motivo, input.detalle, input.referenciaExterna, context, now);
    await repo.lifecycleUpdate(row.idTicket, { idEstado });
    await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 1, null);
    await repo.log(row.idTicket, context, 'PAUSA', {}, { motivo: input.motivo, detalle: input.detalle }, now);
    await lifecycleStateLog(repo, row, 'EN_ESPERA', context, now);
    return;
  }
  const idEstado = await lifecycleTransition(repo, row, 'EN_ATENCION', context, input.motivo);
  const pause = await repo.openPause(row.idTicket);
  if (!pause || now < pause.inicio) throw new AppError('TRANSICION_INVALIDA', 409, 'No hay una pausa válida para reanudar.');
  const calendar = await repo.cycleCalendar(row.idTicket, row.numeroReaperturas + 1, row.idSede);
  const priority = await repo.lifecyclePriority(row.idPrioridad);
  const minutes = Math.floor(contarMinutosSla(pause.inicio, now, { modoCalendario: priority.modoCalendario, calendario: calendar }));
  await repo.endPause(pause.idPausa, now, minutes);
  const start = await repo.cycleStart(row.idTicket, row.fechaCreacion);
  const deadlines = calcularFechasLimiteSla(start, priority, calendar, await repo.pauses(row.idTicket));
  if (!deadlines.fechaLimiteRespuesta || !deadlines.fechaLimiteSolucion) throw new AppError('TRANSICION_INVALIDA', 409, 'Queda otra pausa abierta.');
  await repo.lifecycleUpdate(row.idTicket, { idEstado, minutosPausa: row.minutosPausa + minutes,
    fechaLimiteRespuesta: row.fechaPrimeraRespuesta ? row.fechaLimiteRespuesta : deadlines.fechaLimiteRespuesta, fechaLimiteSolucion: deadlines.fechaLimiteSolucion });
  await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 1, deadlines.fechaAlertaSolucion);
  await repo.log(row.idTicket, context, 'REANUDACION', {}, { minutos: minutes, motivo: input.motivo }, now);
  await lifecycleStateLog(repo, row, 'EN_ATENCION', context, now);
}
