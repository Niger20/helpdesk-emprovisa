import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { useSlaSettings } from '../hooks/useSlaSettings';
import { SlaSettingsWorkspace } from '../components/SlaSettingsWorkspace';

export default function SlaSettingsPage() {
  const query = useSlaSettings();
  return <AppShell><section className="space-y-5 p-4 sm:p-6"><h1 className="text-2xl font-bold">Prioridades y acuerdos de servicio</h1>
    <p className="text-sm text-muted">Configuración compartida entre las sedes. Los valores normativos de matriz, plazos y alerta son de consulta.
      La administración permite cambiar nombres y deja evidencia en auditoría; conserva los ciclos de SLA de los tickets.</p>
    <SlaSettingsWorkspace query={query} /></section></AppShell>;
}
