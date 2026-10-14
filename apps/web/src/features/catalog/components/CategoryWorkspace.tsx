import { QueryBoundary } from '../../../components/common/QueryBoundary';
import type { useCategories } from '../hooks/useCategories';
import { CategoryForm } from './CategoryForm';
import { CategoryTable } from './CategoryTable';

export function CategoryWorkspace({ state }: { state: ReturnType<typeof useCategories> }) {
  const { query, filter, list, catalog, selected, setSelected } = state;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-3 text-sm"><label>Buscar por nombre<input className="mt-1 block min-h-10 rounded border border-input bg-card px-3" maxLength={80} value={query.q} onChange={(event) => filter({ q: event.target.value })} /></label>
      <label>Estado<select className="mt-1 block min-h-10 rounded border border-input bg-card px-3" value={query.estado} onChange={(event) => filter({ estado: event.target.value as typeof query.estado })}>
        <option value="TODAS">Todas</option><option value="ACTIVAS">Activas</option><option value="INACTIVAS">Inactivas</option></select></label>
      <button type="button" className="min-h-10 rounded border border-input px-3" onClick={() => setSelected(null)}>Nueva categoría</button>
      <button type="button" className="min-h-10 rounded border border-input px-3" onClick={() => { setSelected(null); void list.refetch(); void catalog.refetch(); }}>Recargar</button>
    </div>
    <QueryBoundary query={list} isEmpty={(data) => data.data.length === 0}>{(data) => <CategoryTable data={data.data} select={setSelected} />}</QueryBoundary>
    <div className="flex flex-wrap items-center gap-3 text-sm"><button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={query.page <= 1 || list.isFetching} onClick={() => filter({ page: query.page - 1 })}>Anterior</button>
      <span>Página {query.page} · {list.data?.meta.total ?? 0} categorías</span>
      <button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={!list.data || query.page * query.pageSize >= list.data.meta.total || list.isFetching} onClick={() => filter({ page: query.page + 1 })}>Siguiente</button></div>
    {state.notice && <p role="status" className="text-sm">{state.notice}</p>}
    <QueryBoundary query={catalog} isEmpty={() => false}>{(data) => <CategoryForm key={JSON.stringify(selected)} selected={selected} catalog={data} saved={state.saved} />}</QueryBoundary>
  </div>;
}
