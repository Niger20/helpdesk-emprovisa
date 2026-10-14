import type { TicketOptions } from '@helpdesk/contracts';
import { useTicketForm } from '../../hooks/useTicketForm';
import { TicketFields } from './TicketFields';
import { CategoryField } from './CategoryField';
import { AssetSearchField } from './AssetSearchField';
import { RequesterField } from './RequesterField';

export function TicketForm({ options }: { options: TicketOptions }) {
  const state = useTicketForm(options);
  return <form onSubmit={(event) => { void state.submit(event); }} className="max-w-3xl space-y-5 rounded-lg border border-border bg-card p-5" aria-busy={state.pending}>
    {state.error && <p role="alert" className="rounded border border-danger bg-danger-soft p-3 text-danger">{state.error}</p>}
    {state.numeroTicketOrigen && <p className="text-sm text-muted">Este requerimiento quedará vinculado al caso cerrado {state.numeroTicketOrigen}.</p>}
    {state.form.formState.errors.numeroTicketOrigen && <p role="alert" className="text-sm text-danger">El número de origen no es válido. Abrí el nuevo caso desde la ficha del ticket cerrado.</p>}
    <RequesterField form={state.form} options={options.solicitantes} thirdParty={state.tercero} />
    <TicketFields form={state.form} /><CategoryField form={state.form} options={state.categorias} />
    <AssetSearchField form={state.form} options={state.activos} required={state.requiereActivo} />
    <p role="status" className="rounded bg-background p-4 text-sm">Prioridad calculada: <strong>{state.prioridad}</strong>. Los plazos se calculan al registrar según el calendario de la sede.</p>
    <button disabled={state.pending} type="submit" className="min-h-11 rounded bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-60">{state.pending ? 'Registrando…' : 'Registrar requerimiento'}</button>
  </form>;
}
