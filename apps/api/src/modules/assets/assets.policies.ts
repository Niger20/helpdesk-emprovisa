import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function assetScope(context: SessionContext | null, permiso: Permiso) {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  const grants = context.grants.filter((grant) => grant.codigo === permiso);
  if (!context.usuario.permisos.includes(permiso) || grants.length === 0) {
    throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta acción.');
  }
  return grants.some((grant) => grant.idSedeAlcance === null) ? null : grants.map((grant) => grant.idSedeAlcance).filter((sede): sede is number => sede !== null);
}

export function assertAssetSede(context: SessionContext | null, permiso: Permiso, idSede: number) {
  const scope = assetScope(context, permiso);
  if (scope !== null && !scope.includes(idSede)) throw new AppError('NO_AUTORIZADO', 403, 'No tenés acceso a esta sede.');
}

export function assetIncidentScope(context: SessionContext) {
  const can = (permiso: Permiso) => context.usuario.permisos.includes('ticket.ver') && context.usuario.permisos.includes(permiso);
  return { all: can('ticket.ver_todos'), own: can('ticket.ver_propios'), group: can('ticket.ver_grupo'), userId: context.usuario.idUsuario,
    sites: can('ticket.ver_sede') ? context.grants.filter((grant) => grant.codigo === 'ticket.ver_sede')
      .map((grant) => grant.idSedeAlcance).filter((id): id is number => id !== null) : [] };
}
export type AssetIncidentScope = ReturnType<typeof assetIncidentScope>;
