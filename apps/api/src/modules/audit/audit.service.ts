import { auditQuerySchema, auditIntegritySchema, reportsQuerySchema } from '@helpdesk/contracts';
import type { AuditQuery, ReportsQuery, ReportsFormat } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import type { createAuditRepository } from './audit.repository.js';
import { auditAccess } from './audit.policies.js';
import { mapAudit } from './audit.mapper.js';
import { AppError } from '../../common/errors/app-error.js';

export function buildAuditService(repository: ReturnType<typeof createAuditRepository>) {
  return {
    list: async (context: SessionContext | null, input: AuditQuery) => {
      const query = auditQuerySchema.parse(input);
      const sedes = auditAccess(context, query.clase === 'SISTEMA');
      return mapAudit(await repository.list(query, sedes, context?.usuario.idUsuario ?? -1), query);
    },
    integrity: async (context: SessionContext | null) => {
      auditAccess(context, true, true);
      return auditIntegritySchema.parse({ ...await repository.integrity(), verificadaEn: new Date().toISOString() });
    },
  };
}
export function buildReportRecorder(repository: ReturnType<typeof createAuditRepository>) {
  return async (context: SessionContext | null, input: ReportsQuery, format?: ReportsFormat, ip?: string) => {
    const codigo = format ? 'reporte.exportar' : 'reporte.ver';
    if (!context?.usuario.permisos.includes(codigo) || !context.grants.some((grant) => grant.codigo === codigo
      && (input.idSede === undefined || grant.idSedeAlcance === null || grant.idSedeAlcance === input.idSede))) throw new AppError('NO_AUTORIZADO', 403, 'No se permite registrar esta operación de reportes.');
    await repository.recordReport(context, reportsQuerySchema.parse(input), format, ip);
  };
}
