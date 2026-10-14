import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useKnowledgeList } from '../hooks/useKnowledgeList';
import { KnowledgeFilters } from '../components/KnowledgeFilters';
import { KnowledgeList } from '../components/KnowledgeList';
import { KnowledgeForm } from '../components/KnowledgeForm';

export function KnowledgeListPage() {
  const state = useKnowledgeList();
  return <AppShell><div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Base de conocimientos</h1>
      <p className="mt-1 text-sm text-muted">Guías y procedimientos para resolver dudas frecuentes.</p></div>
      {state.canEdit && <button onClick={() => state.setShowForm(true)} className="min-h-10 rounded bg-primary px-4 text-primary-foreground">Nuevo artículo</button>}</header>
    <QueryBoundary query={state.catalog} isEmpty={(data) => data.categorias.length === 0}>{(catalog) => <>
      {state.showForm && state.canEdit && <KnowledgeForm catalog={catalog} onCancel={() => state.setShowForm(false)} />}
      <KnowledgeFilters filters={state.filters} catalog={catalog} onChange={state.changeFilters} />
    </>}</QueryBoundary>
    <QueryBoundary query={state.query} isEmpty={(data) => data.data.length === 0}>{(data) => <KnowledgeList data={data} onPage={(page) => state.changeFilters({ page })} />}</QueryBoundary>
  </div></AppShell>;
}
