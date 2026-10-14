import { reportsCatalogSchema, reportsSchema, problemSchema } from '@helpdesk/contracts';
import type { ReportsQuery, ReportsFormat } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export function reportSearch(query: ReportsQuery) {
  const params = new URLSearchParams({ desde: query.desde, hasta: query.hasta });
  if (query.idSede) params.set('idSede', String(query.idSede));
  if (query.idCategoria) params.set('idCategoria', String(query.idCategoria));
  return params.toString();
}
export const fetchReports = (query: ReportsQuery, signal: AbortSignal) => http(`/api/v1/reportes?${reportSearch(query)}`, reportsSchema, { signal });
export const fetchReportCatalog = (signal: AbortSignal) => http('/api/v1/reportes/catalogos', reportsCatalogSchema, { signal });
export async function downloadReport(query: ReportsQuery, format: ReportsFormat) {
  const response = await fetch(`/api/v1/reportes/exportar/${format}?${reportSearch(query)}`, { credentials: 'same-origin' });
  if (!response.ok) {
    const problem = problemSchema.safeParse(await response.json());
    throw new Error(problem.success ? problem.data.detail : 'No se pudo descargar el reporte.');
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `EMPROVISA-${query.desde}-${query.hasta}.${format}`;
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
