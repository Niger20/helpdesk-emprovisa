import { reportsCatalogSchema, reportsQuerySchema } from '@helpdesk/contracts';
import type { ReportsFormat, ReportsQuery } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import type { ReportsRepository } from './reports.repository.js';
import { assertReportSede, reportsAccess } from './reports.policies.js';
import { mapReport } from './reports.mapper.js';
import { exportExcel } from './exports/excel.js';
import { exportPdf } from './exports/pdf.js';
import { reportFilterLabels } from './domain/export-labels.js';
import type { ReportAuditRecorder } from '../audit/index.js';

export function buildReportsService(repository: ReportsRepository, recorder?: ReportAuditRecorder) {
  const snapshot = async (context: SessionContext | null, input: ReportsQuery, exportar = false) => {
    const sedes = reportsAccess(context, exportar); const query = reportsQuerySchema.parse(input); assertReportSede(sedes, query.idSede);
    return mapReport(await repository.snapshot(query, sedes), query);
  };
  return { dashboard: async (context: SessionContext | null, input: ReportsQuery, ip?: string) => {
    const result = await snapshot(context, input); await recorder?.(context, result.filtros, undefined, ip); return result;
  },
    catalog: async (context: SessionContext | null) => reportsCatalogSchema.parse(await repository.catalog(reportsAccess(context))),
    export: async (context: SessionContext | null, input: ReportsQuery, format: ReportsFormat, ip?: string) => {
      const report = await snapshot(context, input, true);
      const catalog = await repository.catalog(reportsAccess(context, true));
      const labels = reportFilterLabels(report.filtros, catalog);
      const buffer = await (format === 'xlsx' ? exportExcel(report, labels) : exportPdf(report, labels));
      await recorder?.(context, report.filtros, format, ip); return buffer;
    },
  };
}
export type ReportsService = ReturnType<typeof buildReportsService>;
