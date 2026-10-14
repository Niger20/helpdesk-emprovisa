import type { UseFormReturn } from 'react-hook-form';
import type { RoleCatalog, RoleCatalogInput } from '@helpdesk/contracts';

export function PermissionField({ form, permissions }: { form: UseFormReturn<RoleCatalogInput>; permissions: RoleCatalog['permisos'] }) {
  return <fieldset className="space-y-2 rounded border border-border p-3">
    <legend className="px-1 font-semibold">Permisos del rol</legend>
    <p className="text-sm text-muted">Solo podés conceder permisos que poseés con alcance global. Acceso a sesión es obligatorio.</p>
    <div className="grid gap-2 sm:grid-cols-2">{permissions.map((permission) => <label key={permission.codigo}
      className="flex min-h-10 items-center gap-3 rounded border border-border p-2">
      <input type="checkbox" value={permission.codigo} {...form.register('permisos')} />
      <span className="break-all text-sm">{permission.codigo}<span className="block text-muted">{permission.descripcion}</span></span>
    </label>)}</div>
    {form.formState.errors.permisos && <p role="alert" className="text-danger">{form.formState.errors.permisos.message}</p>}
  </fieldset>;
}
