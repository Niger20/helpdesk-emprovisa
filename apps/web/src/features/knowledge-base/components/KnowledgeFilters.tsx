import type { KnowledgeCatalog, KnowledgeQuery } from '@helpdesk/contracts';

interface Props { filters: KnowledgeQuery; catalog: KnowledgeCatalog; onChange: (value: Partial<KnowledgeQuery>) => void }
export function KnowledgeFilters({ filters, catalog, onChange }: Props) {
  return <section aria-label="Buscar artículos" className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
    <label className="space-y-1 text-sm font-semibold">Palabra clave<input type="search" maxLength={150} value={filters.q ?? ''}
      placeholder="Buscar una guía o procedimiento" className="min-h-10 w-full rounded border border-border bg-background px-3"
      onChange={(event) => onChange({ q: event.target.value })} /></label>
    <label className="space-y-1 text-sm font-semibold">Categoría<select value={filters.idCategoria ?? ''}
      className="min-h-10 w-full rounded border border-border bg-background px-3" onChange={(event) => onChange({ idCategoria: event.target.value ? Number(event.target.value) : undefined })}>
      <option value="">Todas las categorías</option>{catalog.categorias.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombre}</option>)}
    </select></label>
  </section>;
}
