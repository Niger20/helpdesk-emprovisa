import type { SessionContext } from '../../auth/index.js';
import { AppError } from '../../../common/errors/app-error.js';

export function requireSlaAdmin(context: SessionContext | null): asserts context is SessionContext {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  if (!context.usuario.permisos.includes('parametro.administrar') ||
    !context.grants.some((grant) => grant.codigo === 'parametro.administrar' && grant.idSedeAlcance === null)) {
    throw new AppError('NO_AUTORIZADO', 403, 'La administración de SLA requiere permiso global para todas las sedes.');
  }
}
