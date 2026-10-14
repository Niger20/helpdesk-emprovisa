import type { AdminUser } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { useIdentityMutation } from '../hooks/useIdentity';
import { usePasswordForm } from '../hooks/useIdentityForms';
import { setUserState, unlockUser } from '../api/identity.api';
import { FormFeedback } from './FormFeedback';

export function UserAccessPanel({ user }: { user: AdminUser }) {
  const session = useAuth(); const self = user.idUsuario === session.data?.usuario.idUsuario;
  const state = useIdentityMutation((activo: boolean, csrf) => setUserState(user.idUsuario, activo, csrf));
  const unlock = useIdentityMutation((_input: undefined, csrf) => unlockUser(user.idUsuario, csrf));
  const { form, mutation, submit } = usePasswordForm(user.idUsuario);
  return <section className="space-y-4 rounded border border-border bg-card p-4 text-sm"><h2 className="text-lg font-semibold">Acceso local</h2>
    <p>Estado: {user.estado} · Intentos fallidos: {user.intentosFallidos}. Los cambios de acceso cierran las sesiones del usuario.</p>
    {self ? <p>Otro administrador debe modificar tu acceso.</p> : <>
      <div className="flex flex-wrap gap-2"><button type="button" className="min-h-10 rounded border border-input px-4" disabled={state.isPending} onClick={() => state.mutate(user.estado !== 'ACTIVO')}>{user.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'}</button>
        <button type="button" className="min-h-10 rounded border border-input px-4" disabled={unlock.isPending} onClick={() => unlock.mutate(undefined)}>Desbloquear usuario</button></div>
      {(state.error || unlock.error) && <p role="alert" className="text-danger">{state.error?.message ?? unlock.error?.message}</p>}
      {(state.isSuccess || unlock.isSuccess) && <p aria-live="polite">Acceso actualizado.</p>}
      <form onSubmit={(event) => { void submit(event); }} className="space-y-4">
        <label>Nueva contraseña (12 a 128 caracteres)<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="mt-1 min-h-10 w-full rounded border border-input px-3" {...form.register('password')} /></label>
        <FormFeedback pending={mutation.isPending} error={mutation.error} success={mutation.isSuccess} invalid={Boolean(form.formState.errors.password)} />
      </form>
    </>}
  </section>;
}
