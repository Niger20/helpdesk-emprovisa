import type { AdminCatalog, AdminUser } from '@helpdesk/contracts';
import { useUserForm } from '../hooks/useIdentityForms';
import { UserProfileFields } from './UserProfileFields';
import { FormFeedback } from './FormFeedback';

interface Props { user: AdminUser | null; catalog: AdminCatalog; idSede: number }
export function UserForm({ user, catalog, idSede }: Props) {
  const { form, mutation, submit } = useUserForm(user, idSede);
  return <form onSubmit={(event) => { void submit(event); }} className="space-y-4 rounded border border-border bg-card p-4 text-sm">
    <h2 className="text-lg font-semibold">{user ? `Editar ${user.nombreCompleto}` : 'Alta de usuario local'}</h2>
    {!user && <div className="grid gap-4 sm:grid-cols-2">
      <label>Usuario *<input className="mt-1 min-h-10 w-full rounded border border-input px-3" {...form.register('username')} autoComplete="off" maxLength={50} required /></label>
      <label>Contraseña inicial *<input type="password" className="mt-1 min-h-10 w-full rounded border border-input px-3" {...form.register('password')} autoComplete="new-password" minLength={12} maxLength={128} required />
        <span className="block text-muted">Entre 12 y 128 caracteres.</span></label>
    </div>}
    <UserProfileFields form={form} catalog={catalog} />
    <FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Object.keys(form.formState.errors).length > 0} />
  </form>;
}
