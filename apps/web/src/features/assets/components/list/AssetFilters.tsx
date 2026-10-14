import { estadoActivoSchema } from '@helpdesk/contracts';
import type { AssetCatalog, AssetQuery, EstadoActivo } from '@helpdesk/contracts';
import { assetStateLabels } from '../../lib/format';

interface Props { filters: AssetQuery; catalog: AssetCatalog; onChange: (next: Partial<AssetQuery>) => void }
export function AssetFilters({ filters, catalog, onChange }: Props) {
  const fieldClass = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
    <label className="text-sm">Buscar activo<input type="search" className={fieldClass} value={filters.q} placeholder="Código, serie o custodio" maxLength={100} onChange={(event) => onChange({ q: event.target.value })} /></label>
    <label className="text-sm">Sede<select className={fieldClass} value={filters.idSede ?? ''} onChange={(event) => onChange({ idSede: event.target.value ? Number(event.target.value) : undefined })}>
      <option value="">Todas las sedes disponibles</option>{catalog.sedes.map((sede) => <option key={sede.idSede} value={sede.idSede}>{sede.nombre}</option>)}</select></label>
    <label className="text-sm">Tipo<select className={fieldClass} value={filters.idTipoActivo ?? ''} onChange={(event) => onChange({ idTipoActivo: event.target.value ? Number(event.target.value) : undefined })}>
      <option value="">Todos los tipos</option>{catalog.tiposActivo.map((tipo) => <option key={tipo.idTipoActivo} value={tipo.idTipoActivo}>{tipo.nombre}</option>)}</select></label>
    <label className="text-sm">Estado<select className={fieldClass} value={filters.estado ?? ''} onChange={(event) => onChange({ estado: event.target.value ? event.target.value as EstadoActivo : undefined })}>
      <option value="">Todos los estados</option>{estadoActivoSchema.options.map((estado) => <option key={estado} value={estado}>{assetStateLabels[estado]}</option>)}</select></label>
  </div>;
}
