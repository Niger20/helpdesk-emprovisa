import { QueryBoundary } from '../../../components/common/QueryBoundary';
import type { KnowledgeFeedbackState } from '../hooks/useKnowledgeFeedback';

export function KnowledgeVote({ state, publicado }: { state: KnowledgeFeedbackState; publicado: boolean }) {
  return <section className="space-y-3 rounded border border-border bg-card p-4" aria-label="Utilidad del artículo">
    <h2 className="font-semibold">¿Te sirvió este artículo?</h2>
    <QueryBoundary query={state.feedback} isEmpty={() => false}>{(data) => <>
      <p className="text-sm text-muted">Útil: {data.utiles} · No útil: {data.noUtiles}</p>
      {data.miVoto && <p className="text-sm" role="status">Tu voto actual: {data.miVoto.util ? 'Útil' : 'No útil'}</p>}
      {state.canVote && publicado && <form onSubmit={state.submitVote} className="space-y-3">
        <label className="flex min-h-10 items-center gap-2"><input type="checkbox" {...state.voteForm.register('util')} /> El artículo me resultó útil</label>
        <label className="block">Comentario opcional<textarea maxLength={300} {...state.voteForm.register('comentario')} className="mt-1 block min-h-20 w-full rounded border border-input p-2" /></label>
        <p className="text-sm text-muted">Tu comentario solo es visible para vos. Podés actualizar tu voto.</p>
        {state.voteForm.formState.errors.comentario && <p role="alert" className="text-danger">{state.voteForm.formState.errors.comentario.message}</p>}
        {state.vote.error && <p role="alert" className="text-danger">{state.vote.error.message}</p>}
        <button disabled={state.vote.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground">{state.vote.isPending ? 'Guardando…' : 'Guardar voto'}</button>
        {state.vote.isSuccess && <p role="status">Voto guardado.</p>}
      </form>}
    </>}</QueryBoundary>
  </section>;
}
