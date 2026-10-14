import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { calcularFechasLimiteSla } from '../domain/sla-calculator.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function executeReclassification(repo: TicketsRepository, row: TicketRow, context: SessionContext, input: Extract<TicketLifecycleCommand, { accion: 'reclasificar' }>, now: Date) {
  if (['RESUELTO', 'CERRADO', 'CANCELADO', 'EN_ESPERA'].includes(row.estado)) throw new AppError('TRANSICION_INVALIDA', 409, 'Reclasificá mientras el ticket esté en atención activa o en cola.');
  const category = await repo.category(input.idCategoria);
  if (!category || ![row.tipo, 'AMBOS'].includes(category.tipoAplicable)) throw new AppError('CATALOGO_INVALIDO', 400, 'La categoría no corresponde al tipo del ticket.');
  if (category.requiereActivo && !input.idActivo) throw new AppError('ACTIVO_REQUERIDO', 400, 'La categoría requiere un activo.');
  if (input.idActivo) {
    const asset = await repo.asset(input.idActivo);
    if (!asset || asset.idSede !== row.idSede || asset.estado === 'BAJA') throw new AppError('CATALOGO_INVALIDO', 400, 'El activo no está disponible en esta sede.');
  }
  const priority = input.prioridad ? await repo.manualPriority(input.prioridad) : await repo.priority(input.impacto, input.urgencia);
  if (!priority) throw new AppError('CATALOGO_INVALIDO', 400, 'La prioridad no está disponible.');
  const limits = calcularFechasLimiteSla(await repo.cycleStart(row.idTicket, row.fechaCreacion), priority, await repo.cycleCalendar(row.idTicket, row.numeroReaperturas + 1, row.idSede), await repo.pauses(row.idTicket));
  if (!limits.fechaLimiteRespuesta || !limits.fechaLimiteSolucion) throw new AppError('TRANSICION_INVALIDA', 409, 'Reanudá la pausa antes de reclasificar.');
  await repo.lifecycleUpdate(row.idTicket, { idCategoria: input.idCategoria, idActivo: input.idActivo, impacto: input.impacto, urgencia: input.urgencia,
    idPrioridad: priority.idPrioridad, prioridadManual: input.prioridad !== null, justificacionPrioridad: input.justificacionPrioridad,
    fechaLimiteRespuesta: limits.fechaLimiteRespuesta, fechaLimiteSolucion: limits.fechaLimiteSolucion });
  await repo.lifecycleAlerts(row.idTicket, row.numeroReaperturas + 1, limits.fechaAlertaSolucion);
  await repo.log(row.idTicket, context, 'RECLASIFICACION', { prioridad: row.prioridad, idCategoria: row.idCategoria },
    { prioridad: priority.codigo, idCategoria: input.idCategoria, justificacion: input.justificacionPrioridad }, now);
}
