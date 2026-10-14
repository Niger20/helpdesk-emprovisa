import { Link } from 'react-router';
import { QueryBoundary } from '../../../../components/common/QueryBoundary';
import { useTicketLifecycle } from '../../hooks/useTicketLifecycle';
import { lifecycleLabels } from '../../lib/lifecycle';
import { LifecycleForm } from './LifecycleForm';

export function LifecyclePanel({ numero }: { numero: string }) {
  const state = useTicketLifecycle(numero);
  return <QueryBoundary query={state.query} isEmpty={() => false}>{(options) => <section className="mt-6 rounded-lg border border-border bg-card p-5" aria-labelledby="ciclo-ticket">
    <h2 id="ciclo-ticket" className="mb-3 text-lg font-semibold">Ciclo del ticket</h2>
    <div className="flex flex-wrap gap-3">{options.acciones.map((action) => <button type="button" key={action} disabled={state.mutation.isPending}
      className="min-h-10 rounded border border-input px-4 text-sm disabled:opacity-50" onClick={() => { state.mutation.reset(); state.select(action); }}>{lifecycleLabels[action]}</button>)}</div>
    {options.acciones.length === 0 && <p className="text-sm text-muted">No hay acciones del ciclo disponibles para tu cuenta y el estado actual.</p>}
    {options.requiereTicketNuevo && <Link className="mt-3 inline-flex min-h-10 items-center text-primary underline" to={`/tickets/nuevo?origen=${encodeURIComponent(numero)}`}>Registrar un nuevo ticket vinculado a este caso</Link>}
    {state.selected && options.acciones.includes(state.selected) && <LifecycleForm key={state.selected} action={state.selected} options={options} pending={state.mutation.isPending}
      send={(data) => state.mutation.mutate(data)} onCancel={() => state.select(null)} error={state.mutation.error?.message} />}
    <button type="button" className="mt-4 min-h-10 text-sm text-primary underline" disabled={state.mutation.isPending} onClick={() => { state.select(null); void state.refresh(); }}>Actualizar ficha y ciclo</button>
  </section>}</QueryBoundary>;
}
