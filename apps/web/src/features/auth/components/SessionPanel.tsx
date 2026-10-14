import { useAuth } from '../../../hooks/useAuth';
import { useAuthActions } from '../hooks/useAuthActions';

export function SessionPanel() {
  const query = useAuth();
  const { logoutAction } = useAuthActions();
  const session = query.data;
  if (!session) return null;
  return (
    <section aria-label="Sesión actual" className="mb-6 rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Bienvenido, {session.usuario.nombreCompleto}</h2>
      <p className="mt-2 text-sm text-muted">{session.usuario.sede.nombre} · {session.usuario.roles.map((role) => role.codigo.replaceAll('_', ' ')).join(', ')}</p>
      <button type="button" disabled={logoutAction.isPending} onClick={() => { logoutAction.mutate(session.csrfToken); }}
        className="mt-4 min-h-10 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {logoutAction.isPending ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
      {logoutAction.error && <p role="alert" className="mt-3 text-danger">{logoutAction.error.message}</p>}
    </section>
  );
}
