import { auditListSchema, auditIntegritySchema } from '@helpdesk/contracts';
import type { AuditQuery } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchAudit = (query: AuditQuery, signal: AbortSignal) => {
  const params = new URLSearchParams({ clase: query.clase, desde: query.desde, hasta: query.hasta, page: String(query.page), pageSize: String(query.pageSize) });
  for (const key of ['numero', 'accion', 'entidad'] as const) if (query[key]) params.set(key, query[key]);
  return http(`/api/v1/auditoria?${params}`, auditListSchema, { signal });
};
export const verifyAudit = () => http('/api/v1/auditoria/integridad', auditIntegritySchema);
