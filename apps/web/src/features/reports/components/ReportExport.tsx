import type { ReportsFormat } from '@helpdesk/contracts';
interface Props { pending: boolean; error: Error | null; onDownload: (format: ReportsFormat) => void }
export function ReportExport({ pending, error, onDownload }: Props) {
  return <section aria-label="Exportar reporte" className="space-y-2"><div className="flex flex-wrap gap-3">
    <button disabled={pending} onClick={() => onDownload('pdf')} className="min-h-10 rounded border border-border bg-card px-4 disabled:opacity-60">Exportar PDF</button>
    <button disabled={pending} onClick={() => onDownload('xlsx')} className="min-h-10 rounded border border-border bg-card px-4 disabled:opacity-60">Exportar Excel</button>
  </div>{pending && <p role="status" className="text-sm">Preparando descarga…</p>}{error && <p role="alert" className="text-sm text-danger">{error.message} Podés reintentar la descarga.</p>}</section>;
}
