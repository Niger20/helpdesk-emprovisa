import type { KnowledgeDetail } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';

export function KnowledgeArticle({ article }: { article: KnowledgeDetail }) {
  return <article className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-5">
    <header><p className="text-sm text-muted">{article.categoria} · {article.estado} · {article.visibilidad}</p>
      <h1 className="mt-2 break-words text-2xl font-semibold">{article.titulo}</h1><p className="mt-2 break-words text-muted">{article.resumen}</p></header>
    <p className="text-sm">Versión {article.versionActual} · Autor: {article.autor} · Revisor: {article.revisor ?? 'Sin revisión'}</p>
    {article.publicadoEn && <p className="text-sm text-muted">Publicado: {formatDate(article.publicadoEn)}</p>}
    <div className="whitespace-pre-wrap break-words leading-relaxed">{article.contenido}</div>
  </article>;
}
