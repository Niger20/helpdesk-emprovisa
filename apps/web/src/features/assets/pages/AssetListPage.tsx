import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useAssetList } from '../hooks/useAssetList';
import { AssetFilters } from '../components/list/AssetFilters';
import { AssetTable } from '../components/list/AssetTable';
import { AssetForm } from '../components/form/AssetForm';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';

export function AssetListPage() {
  const state = useAssetList();
  return <AppShell><div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Inventario de activos</h1>
      <p className="mt-1 text-sm text-muted">Equipos, actas patrimoniales y custodios de EMPROVISA.</p></div>
      {state.canCreate && <button className="min-h-10 rounded bg-primary px-4 text-primary-foreground" onClick={() => state.setShowForm(true)}>Registrar activo</button>}</header>
    <QueryBoundary query={state.catalog} isEmpty={(data) => data.sedes.length === 0}>{(catalog) => <>
      {state.showForm && state.canCreate && <AssetForm catalog={catalog} onCancel={() => state.setShowForm(false)} />}
      <AssetFilters filters={state.filters} catalog={catalog} onChange={state.changeFilters} />
    </>}</QueryBoundary>
    <QueryBoundary query={state.query} isEmpty={(data) => data.data.length === 0}>{(data) => <AssetTable data={data} onPage={(page) => state.changeFilters({ page })} />}</QueryBoundary>
  </div></AppShell>;
}
