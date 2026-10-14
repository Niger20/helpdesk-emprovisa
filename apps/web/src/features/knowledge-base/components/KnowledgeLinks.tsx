import { Link } from 'react-router';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import type { KnowledgeFeedbackState } from '../hooks/useKnowledgeFeedback';
import { formatDate } from '../../../lib/format';

export function KnowledgeLinks({ state, publicado }: { state: KnowledgeFeedbackState; publicado: boolean }) {
  return <section className="space-y-3 rounded border border-border bg-card p-4" aria-label="Tickets vinculados">
    <h2 className="font-semibold">Tickets vinculados</h2>
    <p className="text-sm text-muted">Se muestran únicamente los tickets disponibles para tu cuenta.</p>
    <QueryBoundary query={state.links} isEmpty={(data) => data.data.length === 0}>{(data) => <ul className="space-y-2">
      {data.data.map((item) => <li key={item.numero} className="flex flex-wrap items-center gap-3">
        <Link className="inline-flex min-h-10 items-center text-primary underline" to={`/tickets/${item.numero}`}>{item.numero}</Link>
        <span>{item.uso} · {formatDate(item.fecha)}</span>
        {state.canLink && <button disabled={state.unlink.isPending} onClick={() => state.unlink.mutate(item)} className="min-h-10 rounded border border-input px-3" aria-label={`Desvincular ${item.numero}`}>Desvincular</button>}
      </li>)}
    </ul>}</QueryBoundary>
    {state.canLink && publicado && <form onSubmit={state.submitLink} className="space-y-3">
      <label className="block">Número de ticket<input placeholder="TK-000123" {...state.linkForm.register('numero')} className="mt-1 block min-h-10 w-full rounded border border-input px-3" /></label>
      {state.linkForm.formState.errors.numero && <p role="alert" className="text-danger">{state.linkForm.formState.errors.numero.message}</p>}
      <label className="block">Uso del artículo<input maxLength={10} {...state.linkForm.register('uso')} className="mt-1 block min-h-10 w-full rounded border border-input px-3" /></label>
      {state.linkForm.formState.errors.uso && <p role="alert" className="text-danger">{state.linkForm.formState.errors.uso.message}</p>}
      <button disabled={state.link.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground">{state.link.isPending ? 'Vinculando…' : 'Vincular ticket'}</button>
    </form>}
    {(state.link.error ?? state.unlink.error) && <p role="alert" className="text-danger">{(state.link.error ?? state.unlink.error)?.message}</p>}
  </section>;
}
