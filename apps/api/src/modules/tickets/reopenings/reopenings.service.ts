import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { lifecycleTransition, lifecycleStateLog, assertTicketOwner } from '../lifecycle/lifecycle.service.js';
import { puedeReabrirTicket } from '../domain/sla-reopening.js';
import { calcularFechasLimiteSla } from '../domain/sla-calculator.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function executeReopening(repo: TicketsRepository, row: TicketRow, context: SessionContext, input: Extract<TicketLifecycleCommand, { accion: 'reabrir' | 'rechazar' }>, now: Date) {
  assertTicketOwner(context, row);
  if (input.accion === 'reabrir' && row.estado !== 'CERRADO') throw new AppError('TRANSICION_INVALIDA', 409, 'Solo se reabre un caso cerrado.');
  const calendar = await repo.calendar(row.idSede);
  if (input.accion === 'reabrir' && (!row.fechaCierre || !puedeReabrirTicket(row.fechaCierre, now, calendar))) {
    throw new AppError('REAPERTURA_FUERA_PLAZO', 409, 'Pasaron los cinco días hábiles. Registrá un ticket nuevo vinculado a este caso.');
  }
  if (input.accion === 'rechazar' && row.estado !== 'RESUELTO') throw new AppError('TRANSICION_INVALIDA', 409, 'Solo se rechaza una solución pendiente de confirmación.');
  const destino = input.accion === 'reabrir' ? 'REABIERTO' : 'EN_ATENCION';
  const idEstado = await lifecycleTransition(repo, row, destino, context, input.motivo);
  const limits = calcularFechasLimiteSla(now, await repo.lifecyclePriority(row.idPrioridad), calendar);
  if (!limits.fechaLimiteRespuesta || !limits.fechaLimiteSolucion) throw new Error('No se calcularon los plazos del nuevo ciclo.');
  await repo.reopeningRecord(row.idTicket, context.usuario.idUsuario, input.motivo, now, limits.fechaLimiteSolucion);
  await repo.lifecycleUpdate(row.idTicket, { idEstado, numeroReaperturas: row.numeroReaperturas + 1, fechaPrimeraRespuesta: null, fechaResolucion: null,
    fechaCierre: null, slaRespuestaCumplido: null, slaSolucionCumplido: null, minutosPausa: 0,
    fechaLimiteRespuesta: limits.fechaLimiteRespuesta, fechaLimiteSolucion: limits.fechaLimiteSolucion });
  await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 2, limits.fechaAlertaSolucion);
  await repo.log(row.idTicket, context, 'REAPERTURA', {}, { motivo: input.motivo, ciclo: row.numeroReaperturas + 2 }, now);
  await lifecycleStateLog(repo, row, destino, context, now);
}
