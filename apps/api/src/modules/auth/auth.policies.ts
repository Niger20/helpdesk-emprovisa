import type { Permiso } from '@helpdesk/contracts';
import { AppError } from '../../common/errors/app-error.js';
import type { SessionContext } from './auth.types.js';

export function assertPermission(context: SessionContext | null, permiso: Permiso, idSede?: number) {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  if (!context.usuario.permisos.includes(permiso)) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta acción.');
  if (idSede !== undefined && !context.grants.some((grant) => grant.codigo === permiso
    && (grant.idSedeAlcance === null || grant.idSedeAlcance === idSede))) {
    throw new AppError('NO_AUTORIZADO', 403, 'No tenés acceso a esta sede.');
  }
}
