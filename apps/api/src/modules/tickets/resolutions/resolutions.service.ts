import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { lifecycleTransition, lifecycleStateLog, assertTicketResolver, assertTicketOwner } from '../lifecycle/lifecycle.service.js';
import { evaluarCumplimientoSla } from '../domain/sla-compliance.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function executeResolution(repo: TicketsRepository, row: TicketRow, context: SessionContext, input: Extract<TicketLifecycleCommand, { accion: 'resolver' | 'cerrar' | 'cancelar' }>, now: Date) {
  if (input.accion === 'resolver') {
    assertTicketResolver(context, row);
    const idEstado = await lifecycleTransition(repo, row, 'RESUELTO', context, input.solucion);
    const start = await repo.cycleStart(row.idTicket, row.fechaCreacion);
    const priority = await repo.lifecyclePriority(row.idPrioridad);
    const firstReply = row.fechaPrimeraRespuesta ?? now;
    const compliance = evaluarCumplimientoSla(start, firstReply, now, priority, await repo.calendar(row.idSede), await repo.pauses(row.idTicket));
    await repo.resolveRecord(row.idTicket, row.numeroReaperturas + 1, context.usuario.idUsuario, input.causa, input.solucion, now);
    await repo.lifecycleUpdate(row.idTicket, { idEstado, fechaResolucion: now, fechaPrimeraRespuesta: firstReply,
      slaRespuestaCumplido: compliance.slaRespuestaCumplido, slaSolucionCumplido: compliance.slaSolucionCumplido });
    await repo.addResolutionComment(row.idTicket, input.solucion, context.usuario.idUsuario, now);
    await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 1, null);
    await repo.log(row.idTicket, context, 'RESOLUCION', {}, { solucion: input.solucion, causa: input.causa }, now);
    await lifecycleStateLog(repo, row, 'RESUELTO', context, now);
    return;
  }
  assertTicketOwner(context, row);
  if (input.accion === 'cerrar' && context.usuario.permisos.includes('ticket.resolver')) throw new AppError('NO_AUTORIZADO', 403, 'Un técnico no puede validar su propio requerimiento.');
  const destino = input.accion === 'cerrar' ? 'CERRADO' : 'CANCELADO';
  const motivo = input.accion === 'cerrar' ? 'Solución confirmada por el solicitante' : input.motivo;
  const idEstado = await lifecycleTransition(repo, row, destino, context, motivo, input.accion === 'cerrar' && input.confirmacion);
  await repo.lifecycleUpdate(row.idTicket, { idEstado, fechaCierre: now });
  await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 1, null);
  await repo.log(row.idTicket, context, input.accion === 'cerrar' ? 'CIERRE' : 'CANCELACION', {}, { motivo }, now);
  await lifecycleStateLog(repo, row, destino, context, now);
}
