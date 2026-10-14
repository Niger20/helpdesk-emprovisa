import type { RoleCatalog, RoleCatalogRole } from '@helpdesk/contracts';
import { useRoleForm } from '../hooks/useRoleForm';
import { PermissionField } from './PermissionField';

export function RoleForm({ role, permissions, onSaved, onCancel }: { role: RoleCatalogRole | null;
  permissions: RoleCatalog['permisos']; onSaved: () => void; onCancel: () => void }) {
  const { form, mutation, submit, reload } = useRoleForm(role, onSaved);
  return <form noValidate className="space-y-4 rounded border border-border bg-card p-4" onSubmit={(event) => { void submit(event); }}>
    <h2 className="font-semibold">{role ? `Editar ${role.nombre}` : 'Crear rol personalizado'}</h2>
    <label className="block">Código
      <input className="mt-1 min-h-10 w-full rounded border border-input bg-background px-3" maxLength={30}
        aria-invalid={Boolean(form.formState.errors.codigo)} {...form.register('codigo')} />
    </label>
    {form.formState.errors.codigo && <p role="alert" className="text-danger">{form.formState.errors.codigo.message}</p>}
    <label className="block">Nombre
      <input className="mt-1 min-h-10 w-full rounded border border-input bg-background px-3" maxLength={60}
        aria-invalid={Boolean(form.formState.errors.nombre)} {...form.register('nombre')} />
    </label>
    {form.formState.errors.nombre && <p role="alert" className="text-danger">{form.formState.errors.nombre.message}</p>}
    <label className="block">Descripción
      <textarea className="mt-1 min-h-20 w-full rounded border border-input bg-background px-3 py-2" maxLength={200}
        {...form.register('descripcion', { setValueAs: (value: unknown) => typeof value === 'string' && value.trim() ? value : null })} />
    </label>
    <PermissionField form={form} permissions={permissions} />
    <p className="text-sm text-muted">Guardar revoca las sesiones de usuarios con asignaciones actuales o futuras. Otro administrador debe editar los roles que te están asignados.</p>
    {mutation.isError && <div role="alert"><p className="text-danger">{mutation.error.message}</p>
      <button type="button" onClick={reload} className="min-h-10 rounded border border-input px-4">Recargar catálogo</button></div>}
    <div className="flex flex-wrap gap-2">
      <button disabled={mutation.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{mutation.isPending ? 'Guardando…' : 'Guardar rol'}</button>
      <button type="button" onClick={onCancel} disabled={mutation.isPending} className="min-h-10 rounded border border-input px-4">Cancelar</button>
    </div>
  </form>;
}
