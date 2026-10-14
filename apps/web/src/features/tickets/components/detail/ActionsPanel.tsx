import { QueryBoundary } from '../../../../components/common/QueryBoundary';
import { useTicketActions } from '../../hooks/useTicketActions';
import { ReplyBox } from './ReplyBox';
import { AssignmentForm } from './AssignmentForm';

export function ActionsPanel({ numero }: { numero: string }) {
  const actions = useTicketActions(numero);
  return <QueryBoundary query={actions.operation} isEmpty={() => false}>{(operation) => <div className="space-y-5">
    {(operation.puedeTomar || operation.puedeAtender || operation.puedeReasignar) && <section aria-labelledby="operacion-ticket" className="rounded-lg border border-border bg-card p-5">
      <h2 id="operacion-ticket" className="mb-3 text-lg font-semibold">Atención del ticket</h2>
      <div className="flex flex-wrap gap-3">{operation.puedeTomar && <button disabled={actions.pending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50"
        onClick={() => actions.assign.mutate({ version: operation.version, idUsuario: actions.userId, motivo: 'Toma de ticket desde la cola' })}>Tomar ticket</button>}
        {operation.puedeAtender && <button disabled={actions.pending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50" onClick={() => actions.attend.mutate(operation.version)}>Iniciar atención</button>}</div>
      {operation.puedeReasignar && <AssignmentForm operation={operation} pending={actions.pending} assign={(data) => actions.assign.mutate(data)} />}
      {(actions.assign.error || actions.attend.error) && <p role="alert" className="mt-3 text-sm text-danger">{actions.assign.error?.message ?? actions.attend.error?.message}</p>}
    </section>}
    {operation.puedeComentar && <ReplyBox version={operation.version} internal={operation.puedeNotaInterna} pending={actions.pending} error={actions.comment.error?.message}
      send={(data, onSuccess) => actions.comment.mutate(data, { onSuccess })} />}
    <button className="min-h-10 text-sm text-primary underline" onClick={() => { void actions.refresh(); }} disabled={actions.pending}>Actualizar ficha y acciones</button>
  </div>}</QueryBoundary>;
}
