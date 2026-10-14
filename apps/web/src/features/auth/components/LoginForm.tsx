import { useLoginForm } from '../hooks/useLoginForm';

export function LoginForm() {
  const { form, submit, pending, error } = useLoginForm();
  return (
    <form onSubmit={(event) => { void submit(event); }} className="space-y-5" aria-busy={pending}>
      {error && <p role="alert" className="rounded-md border border-danger bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-semibold">Usuario</label>
        <input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} {...form.register('username')}
          aria-invalid={Boolean(form.formState.errors.username)} aria-describedby="username-error"
          className="min-h-11 w-full rounded-md border border-input px-3 focus-visible:outline-2 focus-visible:outline-primary" />
        <p id="username-error" className="mt-1 text-sm text-danger">{form.formState.errors.username?.message}</p>
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">Contraseña</label>
        <input id="password" type="password" autoComplete="current-password" {...form.register('password')}
          aria-invalid={Boolean(form.formState.errors.password)} aria-describedby="password-error"
          className="min-h-11 w-full rounded-md border border-input px-3 focus-visible:outline-2 focus-visible:outline-primary" />
        <p id="password-error" className="mt-1 text-sm text-danger">{form.formState.errors.password?.message}</p>
      </div>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {pending ? 'Ingresando…' : 'Entrar'}
      </button>
      <p className="text-sm text-muted">Usá una cuenta local de demostración.</p>
    </form>
  );
}
