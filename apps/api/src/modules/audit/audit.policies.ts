import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function auditAccess(context: SessionContext | null, global = false, verify = false) {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para consultar auditoría.');
  const permissions = verify ? ['auditoria.ver', 'auditoria.verificar'] as const : ['auditoria.ver'] as const;
  const scopes = permissions.map((permission) => {
    const grants = context.grants.filter((grant) => grant.codigo === permission);
    if (!context.usuario.permisos.includes(permission) || !grants.length) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta consulta de auditoría.');
    const all = grants.some((grant) => grant.idSedeAlcance === null);
    if (global && !all) throw new AppError('NO_AUTORIZADO', 403, 'La evidencia global requiere alcance sobre todas las sedes.');
    return all ? null : grants.flatMap((grant) => grant.idSedeAlcance === null ? [] : [grant.idSedeAlcance]);
  });
  const local = scopes.filter((scope): scope is number[] => scope !== null);
  return local.length ? local.reduce((result, scope) => result.filter((id) => scope.includes(id))) : null;
}
