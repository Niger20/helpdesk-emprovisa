import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function requireTicketPermission(context: SessionContext | null, permission: Permiso): asserts context is SessionContext {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  if (!context.usuario.permisos.includes(permission)) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta acción.');
}
export function ticketScope(context: SessionContext) {
  const can = (permission: Permiso) => context.usuario.permisos.includes(permission);
  return { all: can('ticket.ver_todos'), own: can('ticket.ver_propios'), group: can('ticket.ver_grupo'),
    sites: context.grants.filter((grant) => grant.codigo === 'ticket.ver_sede' && grant.idSedeAlcance !== null).map((grant) => grant.idSedeAlcance as number),
    userId: context.usuario.idUsuario, internal: can('ticket.ver_notas_internas') };
}
export function canRegisterFor(context: SessionContext, userId: number, siteId: number) {
  if (userId === context.usuario.idUsuario) return;
  if (!context.grants.some((grant) => grant.codigo === 'ticket.registrar_tercero' && (grant.idSedeAlcance === null || grant.idSedeAlcance === siteId))) {
    throw new AppError('NO_AUTORIZADO', 403, 'No podés registrar requerimientos para ese solicitante.');
  }
}
export type TicketScope = ReturnType<typeof ticketScope>;
