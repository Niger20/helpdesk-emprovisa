import { Link } from 'react-router';
import type { KnowledgeList as List } from '@helpdesk/contracts';

interface Props { data: List; onPage: (page: number) => void }
export function KnowledgeList({ data, onPage }: Props) {
  const { page, pageSize, total } = data.meta;
  return <section aria-label="Artículos encontrados" className="space-y-4">
    <p className="text-sm text-muted">{total} artículos encontrados</p>
    <div className="grid gap-4 md:grid-cols-2">{data.data.map((article) => <article key={article.idArticulo} className="min-w-0 rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted">{article.categoria} · {article.estado} · {article.visibilidad}</p>
      <h2 className="mt-2 break-words text-lg font-semibold"><Link className="inline-flex min-h-10 items-center text-primary underline" to={`/conocimientos/${article.idArticulo}`}>{article.titulo}</Link></h2>
      <p className="mt-2 break-words text-sm">{article.resumen ?? 'Sin resumen.'}</p><p className="mt-3 text-sm text-muted">Versión {article.versionActual} · {article.autor}</p>
    </article>)}</div>
    <nav aria-label="Paginación" className="flex flex-wrap items-center gap-3">
      <button className="min-h-10 rounded border border-border px-4 disabled:opacity-50" disabled={page === 1} onClick={() => onPage(page - 1)}>Anterior</button>
      <span className="text-sm">Página {page} de {Math.max(1, Math.ceil(total / pageSize))}</span>
      <button className="min-h-10 rounded border border-border px-4 disabled:opacity-50" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Siguiente</button>
    </nav>
  </section>;
}
