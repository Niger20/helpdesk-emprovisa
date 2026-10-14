import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { auditQuerySchema } from '@helpdesk/contracts';
import type { AuditQuery } from '@helpdesk/contracts';
import { fetchAudit, verifyAudit } from '../api/audit.api';
import { useAuth } from '../../../hooks/useAuth';

const date = (value: Date) => {
  const parts = new Intl.DateTimeFormat('es-NI', { timeZone: 'America/Managua', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const field = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${field('year')}-${field('month')}-${field('day')}`;
};
export function useAudit() {
  const [filters, setFilters] = useState<AuditQuery>(() => ({ clase: 'BITACORA', desde: date(new Date(Date.now() - 30 * 86400_000)), hasta: date(new Date()), page: 1, pageSize: 20 }));
  const [draft, setDraft] = useState(filters); const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['audit', filters], queryFn: ({ signal }) => fetchAudit(filters, signal) });
  const verification = useMutation({ mutationFn: verifyAudit });
  const apply = () => { const result = auditQuerySchema.safeParse(draft); if (!result.success) { setError('Revisá fechas y filtros de la consulta.'); return; }
    setFilters({ ...result.data, page: 1 }); setError(null); };
  return { query, verification, draft, error, apply, setDraft, canVerify: useAuth().data?.usuario.permisos.includes('auditoria.verificar') ?? false,
    changePage: (page: number) => setFilters((current) => ({ ...current, page })) };
}
