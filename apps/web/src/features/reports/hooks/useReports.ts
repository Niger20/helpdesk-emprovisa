import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReportsQuery, ReportsFormat } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { downloadReport, fetchReportCatalog, fetchReports } from '../api/reports.api';
import { reportsKeys } from '../api/reports.keys';

export function useReports(filters: ReportsQuery) {
  const auth = useAuth();
  const query = useQuery({ queryKey: reportsKeys.dashboard(filters), queryFn: ({ signal }) => fetchReports(filters, signal) });
  const catalog = useQuery({ queryKey: reportsKeys.catalog, queryFn: ({ signal }) => fetchReportCatalog(signal) });
  const download = useMutation({ mutationFn: (format: ReportsFormat) => downloadReport(filters, format) });
  return { query, catalog, download, canExport: auth.data?.usuario.permisos.includes('reporte.exportar') ?? false };
}
