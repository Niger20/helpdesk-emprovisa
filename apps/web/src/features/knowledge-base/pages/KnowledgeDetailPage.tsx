import { Link } from 'react-router';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useKnowledgeDetail } from '../hooks/useKnowledgeDetail';
import { KnowledgeArticle } from '../components/KnowledgeArticle';
import { KnowledgeHistory } from '../components/KnowledgeHistory';
import { KnowledgeForm } from '../components/KnowledgeForm';
import { KnowledgeVote } from '../components/KnowledgeVote';
import { KnowledgeLinks } from '../components/KnowledgeLinks';

export function KnowledgeDetailPage() {
  const state = useKnowledgeDetail();
  return <AppShell><div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/conocimientos" className="inline-flex min-h-10 items-center text-primary underline">Volver a conocimientos</Link>
      {state.canEdit && !state.editing && <button onClick={() => state.setEditing(true)} className="min-h-10 rounded bg-primary px-4 text-primary-foreground">Editar artículo</button>}</div>
    <QueryBoundary query={state.query} isEmpty={() => false}>{(article) => <>
      {state.editing && state.canEdit && <QueryBoundary query={state.catalog} isEmpty={(data) => data.categorias.length === 0}>{(catalog) =>
        <KnowledgeForm key={`${article.idArticulo}-${article.versionActual}`} article={article} catalog={catalog} onCancel={() => state.setEditing(false)} />}</QueryBoundary>}
      <KnowledgeArticle article={article} /><KnowledgeHistory versions={article.versiones} />
      <KnowledgeVote state={state.feedback} publicado={article.estado === 'PUBLICADO'} />
      <KnowledgeLinks state={state.feedback} publicado={article.estado === 'PUBLICADO'} />
    </>}</QueryBoundary>
  </div></AppShell>;
}
