import { AuthLayout } from '../../../app/layouts/AuthLayout';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-primary">Iniciar sesión</h1>
      <p className="mb-6 mt-2 text-sm text-muted">Ingresá con tu cuenta local.</p>
      <LoginForm />
    </AuthLayout>
  );
}
