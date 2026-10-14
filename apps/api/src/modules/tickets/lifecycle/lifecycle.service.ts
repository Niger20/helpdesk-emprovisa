import { permisoSchema } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { AppError } from '../../../common/errors/app-error.js';
import { validateManualTransition } from '../domain/state-machine.js';

export async function lifecycleTransition(repo: TicketsRepository, row: TicketRow, destino: string, context: SessionContext, motivo: string, confirmation = false) {
  const rule = await repo.transition(row.idEstado, destino);
  validateManualTransition(rule ? { ...rule, codigo: permisoSchema.parse(rule.codigo) } : undefined, context.usuario.permisos, motivo, confirmation);
  if (!rule) throw new AppError('TRANSICION_INVALIDA', 409, 'No se permite esta transición.');
  return rule.idEstadoDestino;
}
export async function lifecycleStateLog(repo: TicketsRepository, row: TicketRow, estado: string, context: SessionContext, now: Date) {
  await repo.log(row.idTicket, context, 'CAMBIO_ESTADO', { estado: row.estado }, { estado }, now);
}
export function assertTicketOwner(context: SessionContext, row: TicketRow) {
  if (row.idSolicitante !== context.usuario.idUsuario) throw new AppError('NO_AUTORIZADO', 403, 'Esta acción corresponde al solicitante del ticket.');
}
export function assertTicketResolver(context: SessionContext, row: TicketRow) {
  if (row.idSolicitante === context.usuario.idUsuario) throw new AppError('NO_AUTORIZADO', 403, 'No podés resolver tu propio requerimiento.');
  assertTicketAssignee(context, row);
}
export function assertTicketAssignee(context: SessionContext, row: TicketRow) {
  if (row.idAsignado !== context.usuario.idUsuario) throw new AppError('NO_AUTORIZADO', 403, 'Solo el responsable asignado puede ejecutar esta acción.');
}
