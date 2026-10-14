import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { useCategories } from '../hooks/useCategories';
import { CategoryWorkspace } from '../components/CategoryWorkspace';

export default function CategoryAdminPage() {
  const state = useCategories();
  return <AppShell><div className="space-y-5 p-4 sm:p-6"><h1 className="text-2xl font-bold">Categorías de soporte</h1>
    <p className="text-sm text-muted">Administrá las categorías compartidas y su asignación inicial. Desactivar conserva los tickets y artículos anteriores.</p>
    <CategoryWorkspace state={state} /></div></AppShell>;
}
