import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function reportsAccess(context: SessionContext | null, exportar = false) {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para consultar reportes.');
  const permissions = exportar ? ['reporte.ver', 'reporte.exportar'] as const : ['reporte.ver'] as const;
  const scopes = permissions.map((permission) => {
    const grants = context.grants.filter((grant) => grant.codigo === permission);
    if (!context.usuario.permisos.includes(permission) || !grants.length) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para consultar o exportar reportes.');
    return grants.some((grant) => grant.idSedeAlcance === null) ? null : grants.map((grant) => grant.idSedeAlcance).filter((id): id is number => id !== null);
  });
  const limited = scopes.filter((scope): scope is number[] => scope !== null);
  return limited.length ? limited.reduce((result, scope) => result.filter((id) => scope.includes(id))) : null;
}
export function assertReportSede(sedes: number[] | null, idSede?: number) {
  if (idSede !== undefined && sedes !== null && !sedes.includes(idSede)) throw new AppError('NO_AUTORIZADO', 403, 'La sede está fuera de tu alcance.');
}
