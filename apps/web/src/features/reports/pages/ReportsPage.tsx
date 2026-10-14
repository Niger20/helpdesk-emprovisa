import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useReportFilters } from '../hooks/useReportFilters';
import { useReports } from '../hooks/useReports';
import { ReportFilters } from '../components/ReportFilters';
import { ReportSummary } from '../components/ReportSummary';
import { ReportCharts } from '../components/ReportCharts';
import { ReportBreakdowns } from '../components/ReportBreakdowns';
import { ReportExport } from '../components/ReportExport';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';

export function ReportsPage() {
  const filters = useReportFilters(); const reports = useReports(filters.filters);
  return <AppShell><div className="space-y-6"><header><h1 className="text-2xl font-bold">Tablero ejecutivo</h1><p className="text-muted">Indicadores de servicio y reportes de EMPROVISA.</p></header>
    <QueryBoundary query={reports.catalog} isEmpty={() => false}>{(catalog) => <ReportFilters filters={filters.draft} catalog={catalog} error={filters.error} onChange={filters.change} onApply={filters.apply} />}</QueryBoundary>
    <QueryBoundary query={reports.query} isEmpty={(report) => report.resumen.total === 0}>{(report) => <div className="space-y-6">
      {reports.canExport && <ReportExport pending={reports.download.isPending} error={reports.download.error} onDownload={(format) => reports.download.mutate(format)} />}
      <ReportSummary report={report} /><ReportCharts report={report} /><ReportBreakdowns report={report} />
    </div>}</QueryBoundary>
  </div></AppShell>;
}
