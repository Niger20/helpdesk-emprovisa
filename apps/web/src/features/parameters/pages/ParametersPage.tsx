import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { useParameters } from '../hooks/useParameters';
import { ParametersWorkspace } from '../components/ParametersWorkspace';

export default function ParametersPage() {
  const query = useParameters();
  return <AppShell><div className="space-y-5 p-4 sm:p-6"><h1 className="text-2xl font-bold">Parámetros del sistema</h1>
    <p className="text-sm text-muted">Configuración operativa compartida entre todas las sedes del prototipo local. Cada cambio queda en la auditoría del sistema.</p>
    <ParametersWorkspace query={query} /></div></AppShell>;
}
