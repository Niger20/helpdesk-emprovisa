import { useState } from 'react';
import { reportsQuerySchema } from '@helpdesk/contracts';
import type { ReportsQuery } from '@helpdesk/contracts';
import { initialReportDates } from '../lib/format';

export function useReportFilters() {
  const [draft, setDraft] = useState<ReportsQuery>(initialReportDates);
  const [filters, setFilters] = useState(draft); const [error, setError] = useState<string | null>(null);
  const change = (value: Partial<ReportsQuery>) => { setDraft((current) => ({ ...current, ...value })); setError(null); };
  const apply = () => {
    const result = reportsQuerySchema.safeParse(draft);
    if (!result.success) { setError('Elegí fechas válidas y una fecha final igual o posterior a la inicial.'); return; }
    setFilters(result.data); setError(null);
  };
  return { draft, filters, change, apply, error };
}
