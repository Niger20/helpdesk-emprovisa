import type { AdminCatalog } from '@helpdesk/contracts';
import { Controller } from 'react-hook-form';
import { DateInput } from '../../../components/common/DateInput';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useIdentityMutation, useRoleLinks, useRoles } from '../hooks/useIdentity';
import { useRoleForm } from '../hooks/useIdentityForms';
import { removeRole } from '../api/identity.api';
import { FormFeedback } from './FormFeedback';
import { identityDate } from '../lib/date';

export function RolePanel({ id, catalog }: { id: number; catalog: AdminCatalog }) {
  const links = useRoleLinks(id); const roles = useRoles(); const { form, mutation, submit, idLink, choose, cancel } = useRoleForm(id);
  const removal = useIdentityMutation((link: number, csrf) => removeRole(id, link, csrf));
  const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <section className="space-y-4 rounded border border-border bg-card p-4 text-sm"><h2 className="text-lg font-semibold">Roles, alcance y vigencia</h2>
    <QueryBoundary query={links} isEmpty={(data) => data.length === 0}>{(data) => <ul className="space-y-2">{data.map((link) => <li key={link.idUsuarioRol} className="flex flex-wrap items-center gap-2">
      <span>{link.nombre} · {link.idSedeAlcance === null ? 'Todas las sedes' : catalog.sedes.find((s) => s.idSede === link.idSedeAlcance)?.nombre} · {identityDate(link.vigenteDesde)} a {link.vigenteHasta ? identityDate(link.vigenteHasta) : 'indefinida'}</span>
      <button type="button" disabled={removal.isPending} className="min-h-10 px-3 text-primary underline" onClick={() => removal.mutate(link.idUsuarioRol)}>Retirar rol</button>
      <button type="button" className="min-h-10 px-3 text-primary underline" onClick={() => choose(link)}>Editar alcance o vigencia</button>
    </li>)}</ul>}</QueryBoundary>
    {removal.error && <p role="alert" className="text-danger">{removal.error.message}</p>}
    <QueryBoundary query={roles} isEmpty={(data) => data.length === 0}>{(data) => <form noValidate onSubmit={(event) => { void submit(event); }} className="space-y-4">
      {idLink !== null && <p>Editando asignación. <button type="button" className="min-h-10 text-primary underline" onClick={cancel}>Cancelar edición</button></p>}
      <div className="grid gap-4 sm:grid-cols-2"><label>Rol *<select className={field} {...form.register('idRol', { valueAsNumber: true })} required>
        <option value="">Seleccioná rol</option>{data.map((role) => <option key={role.idRol} value={role.idRol}>{role.nombre}</option>)}</select></label>
      <label>Alcance<select className={field} {...form.register('idSedeAlcance', { setValueAs: (v: string) => v ? Number(v) : null })}>
        <option value="">Todas las sedes</option>{catalog.sedes.map((s) => <option key={s.idSede} value={s.idSede}>{s.nombre}</option>)}</select></label>
      <Controller name="vigenteDesde" control={form.control} render={({ field: date, fieldState }) =>
        <DateInput {...date} label="Vigente desde *" required error={fieldState.error?.message} />} />
      <Controller name="vigenteHasta" control={form.control} render={({ field: date, fieldState }) =>
        <DateInput {...date} value={date.value ?? ''} onChange={(value) => date.onChange(value || null)} label="Vigente hasta" error={fieldState.error?.message} />} /></div>
      <p>Solo podés conceder permisos y sedes dentro de tu acceso vigente. Los roles y permisos del catálogo son de solo lectura.</p>
      <FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Object.keys(form.formState.errors).length > 0} />
    </form>}</QueryBoundary>
  </section>;
}
