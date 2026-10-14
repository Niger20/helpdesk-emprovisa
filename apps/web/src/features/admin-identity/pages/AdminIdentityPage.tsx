import { IdentityWorkspace } from '../components/IdentityWorkspace';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';

export default function AdminIdentityPage() {
  return <AppShell><section className="space-y-5"><h1 className="text-2xl font-bold text-primary">Administración del sistema</h1>
    <p className="text-sm text-muted">Usuarios locales, roles y grupos resolutores del prototipo EMPROVISA.</p><IdentityWorkspace />
  </section></AppShell>;
}
