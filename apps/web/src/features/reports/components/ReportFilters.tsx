import type { ReportsCatalog, ReportsQuery } from '@helpdesk/contracts';
interface Props { filters: ReportsQuery; catalog: ReportsCatalog; error: string | null; onChange: (value: Partial<ReportsQuery>) => void; onApply: () => void }
const field = 'min-h-10 w-full rounded border border-border bg-background px-3';
export function ReportFilters({ filters, catalog, error, onChange, onApply }: Props) {
  return <section aria-label="Filtros del reporte" className="rounded-lg border border-border bg-card p-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label className="space-y-1 text-sm font-semibold">Desde<input type="date" className={field} value={filters.desde} onChange={(event) => onChange({ desde: event.target.value })} /></label>
      <label className="space-y-1 text-sm font-semibold">Hasta<input type="date" className={field} value={filters.hasta} onChange={(event) => onChange({ hasta: event.target.value })} /></label>
      <label className="space-y-1 text-sm font-semibold">Sede<select className={field} value={filters.idSede ?? ''} onChange={(event) => onChange({ idSede: event.target.value ? Number(event.target.value) : undefined })}>
        <option value="">Todas las autorizadas</option>{catalog.sedes.map((site) => <option key={site.idSede} value={site.idSede}>{site.nombre}</option>)}
      </select></label>
      <label className="space-y-1 text-sm font-semibold">Categoría<select className={field} value={filters.idCategoria ?? ''} onChange={(event) => onChange({ idCategoria: event.target.value ? Number(event.target.value) : undefined })}>
        <option value="">Todas</option>{catalog.categorias.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombre}</option>)}
      </select></label>
      <button type="button" onClick={onApply} className="min-h-10 self-end rounded bg-primary px-4 text-primary-foreground">Aplicar filtros</button>
    </div>{error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
  </section>;
}
