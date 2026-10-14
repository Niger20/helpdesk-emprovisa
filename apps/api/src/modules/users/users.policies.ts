import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function identityScope(context: SessionContext | null, permiso: Permiso) {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  const grants = context.grants.filter((grant) => grant.codigo === permiso);
  if (!context.usuario.permisos.includes(permiso) || !grants.length) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para administrar este acceso.');
  return grants.some((grant) => grant.idSedeAlcance === null) ? null : grants.flatMap((grant) => grant.idSedeAlcance === null ? [] : [grant.idSedeAlcance]);
}
export function assertIdentitySede(context: SessionContext | null, permiso: Permiso, idSede: number | null) {
  const scope = identityScope(context, permiso);
  if (scope && (idSede === null || !scope.includes(idSede))) throw new AppError('NO_AUTORIZADO', 403, 'El alcance seleccionado no está autorizado.');
}
export function protectSelf(context: SessionContext, idUsuario: number) {
  if (context.usuario.idUsuario === idUsuario) throw new AppError('ENTRADA_INVALIDA', 409, 'Otro administrador debe modificar tu acceso para evitar un bloqueo accidental.');
}
export function assertDelegable(context: SessionContext, permisos: Permiso[], sede: number | null) {
  for (const permiso of permisos) assertIdentitySede(context, permiso, sede);
}
