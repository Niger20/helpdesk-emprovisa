import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useRoleCatalog } from '../hooks/useRoleCatalog';
import { RoleCatalogPanel } from '../components/RoleCatalogPanel';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';

export default function RoleCatalogPage() {
  const query = useRoleCatalog();
  return <AppShell><section className="space-y-4"><h1 className="text-2xl font-semibold">Roles y permisos</h1>
    <p className="text-muted">Administrá los roles personalizados. Los cinco perfiles del sistema se conservan sin cambios.</p>
    <QueryBoundary query={query} isEmpty={(catalog) => catalog.roles.length === 0}>
      {(catalog) => <RoleCatalogPanel catalog={catalog} />}
    </QueryBoundary>
  </section></AppShell>;
}
