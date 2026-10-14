import type { AdminCatalog } from '@helpdesk/contracts';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useIdentityMutation, useSpecialties } from '../hooks/useIdentity';
import { useSpecialtyForm } from '../hooks/useIdentityForms';
import { removeSpecialty } from '../api/identity.api';
import { FormFeedback } from './FormFeedback';

export function SpecialtyPanel({ id, catalog }: { id: number; catalog: AdminCatalog }) {
  const query = useSpecialties(id); const { form, mutation, submit } = useSpecialtyForm(id);
  const removal = useIdentityMutation((category: number, csrf) => removeSpecialty(id, category, csrf));
  return <section className="space-y-4 rounded border border-border bg-card p-4 text-sm"><h2 className="text-lg font-semibold">Especialidades</h2>
    <QueryBoundary query={query} isEmpty={(data) => data.length === 0}>{(data) => <ul>{data.map((item) => <li key={item.idCategoria}>
      {item.nombre} · Dominio {item.nivelDominio} <button type="button" className="min-h-10 px-3 text-primary underline" disabled={removal.isPending} onClick={() => removal.mutate(item.idCategoria)}>Retirar especialidad</button>
    </li>)}</ul>}</QueryBoundary>
    {removal.error && <p role="alert" className="text-danger">{removal.error.message}</p>}
    <form onSubmit={(event) => { void submit(event); }} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
      <label>Categoría *<select className="mt-1 min-h-10 w-full rounded border border-input px-3" {...form.register('idCategoria', { valueAsNumber: true })} required>
        <option value="">Seleccioná categoría</option>{catalog.categorias.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}</select></label>
      <label>Nivel de dominio (entero positivo) *<input type="number" min={1} max={32767} className="mt-1 min-h-10 w-full rounded border border-input px-3" {...form.register('nivelDominio', { valueAsNumber: true })} required /></label>
    </div><FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Object.keys(form.formState.errors).length > 0} /></form>
  </section>;
}
