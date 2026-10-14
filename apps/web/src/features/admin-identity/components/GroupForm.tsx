import type { AdminCatalog, GroupInput } from '@helpdesk/contracts';
import { useGroupForm } from '../hooks/useIdentityForms';
import { FormFeedback } from './FormFeedback';

export function GroupForm({ group, catalog }: { group: (GroupInput & { idGrupo: number }) | null; catalog: AdminCatalog }) {
  const { form, mutation, submit } = useGroupForm(group); const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <form className="space-y-4 rounded border border-border bg-card p-4 text-sm" onSubmit={(event) => { void submit(event); }}>
    <h2 className="text-lg font-semibold">{group ? 'Editar grupo resolutor' : 'Nuevo grupo resolutor'}</h2>
    <div className="grid gap-4 sm:grid-cols-2"><label>Nombre *<input className={field} maxLength={80} required {...form.register('nombre')} /></label>
      <label>Nivel *<select className={field} {...form.register('nivel', { valueAsNumber: true })}><option value={1}>Nivel 1</option><option value={2}>Nivel 2</option></select></label>
      <label>Sede<select className={field} {...form.register('idSede', { setValueAs: (v: string) => v ? Number(v) : null })}><option value="">Todas las sedes</option>
        {catalog.sedes.map((s) => <option key={s.idSede} value={s.idSede}>{s.nombre}</option>)}</select></label>
      <label>Correo ficticio del grupo<input type="email" className={field} maxLength={120} {...form.register('correoGrupo', { setValueAs: (v: string) => v || null })} /></label>
      <label className="flex min-h-10 items-center gap-2"><input type="checkbox" {...form.register('activo')} />Grupo activo</label>
    </div><FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Object.keys(form.formState.errors).length > 0} />
  </form>;
}
