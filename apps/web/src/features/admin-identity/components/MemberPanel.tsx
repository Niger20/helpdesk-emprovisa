import type { AdminCatalog } from '@helpdesk/contracts';
import { Controller } from 'react-hook-form';
import { DateInput } from '../../../components/common/DateInput';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useIdentityMutation, useMembers } from '../hooks/useIdentity';
import { useMemberForm } from '../hooks/useIdentityForms';
import { removeMember } from '../api/identity.api';
import { FormFeedback } from './FormFeedback';
import { identityDate } from '../lib/date';

export function MemberPanel({ id, catalog }: { id: number; catalog: AdminCatalog }) {
  const query = useMembers(id); const { form, mutation, submit } = useMemberForm(id);
  const removal = useIdentityMutation((user: number, csrf) => removeMember(id, user, csrf));
  const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <section className="space-y-4 rounded border border-border bg-card p-4 text-sm"><h2 className="text-lg font-semibold">Miembros del grupo</h2>
    <QueryBoundary query={query} isEmpty={(data) => data.length === 0}>{(data) => <ul>{data.map((m) => <li key={m.idUsuario}>
      {m.nombreCompleto} · {m.esCoordinador ? 'Coordinador' : 'Miembro'} · {identityDate(m.desde)} a {m.hasta ? identityDate(m.hasta) : 'indefinida'}
      <button type="button" className="min-h-10 px-3 text-primary underline" disabled={removal.isPending} onClick={() => removal.mutate(m.idUsuario)}>Retirar miembro</button>
    </li>)}</ul>}</QueryBoundary>
    {removal.error && <p role="alert" className="text-danger">{removal.error.message}</p>}
    <form noValidate className="space-y-4" onSubmit={(event) => { void submit(event); }}><div className="grid gap-4 sm:grid-cols-2">
      <label>Usuario *<select className={field} required {...form.register('idUsuario', { valueAsNumber: true })}><option value="">Seleccioná usuario</option>
        {catalog.usuarios.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombreCompleto}</option>)}</select></label>
      <label className="flex min-h-10 items-center gap-2"><input type="checkbox" {...form.register('esCoordinador')} />Es coordinador</label>
      <Controller name="desde" control={form.control} render={({ field: date, fieldState }) =>
        <DateInput {...date} label="Desde *" required error={fieldState.error?.message} />} />
      <Controller name="hasta" control={form.control} render={({ field: date, fieldState }) =>
        <DateInput {...date} value={date.value ?? ''} onChange={(value) => date.onChange(value || null)} label="Hasta" error={fieldState.error?.message} />} />
    </div><p>Para editar una membresía, seleccioná el mismo usuario y guardá su nueva vigencia.</p>
      <FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Object.keys(form.formState.errors).length > 0} /></form>
  </section>;
}
