import { auditListSchema } from '@helpdesk/contracts';
import type { AuditQuery } from '@helpdesk/contracts';
import type { createAuditRepository } from './audit.repository.js';

type AuditResult = Awaited<ReturnType<ReturnType<typeof createAuditRepository>['list']>>;
export function mapAudit(result: AuditResult, query: AuditQuery) {
  return auditListSchema.parse({ data: result.data.map((row) => ({ ...row, fechaHora: row.fechaHora.toISOString(),
    actor: row.actor ? `${row.actor} (${row.cuenta})` : 'Sistema' })), meta: { page: query.page, pageSize: query.pageSize, total: result.total } });
}
