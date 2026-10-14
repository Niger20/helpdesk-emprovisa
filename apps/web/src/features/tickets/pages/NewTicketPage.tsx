import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useTicketOptions } from '../hooks/useTicketOptions';
import { TicketForm } from '../components/form/TicketForm';

export function NewTicketPage() {
  const query = useTicketOptions();
  return <AppShell><h1 className="mb-6 text-2xl font-bold">Nuevo requerimiento</h1>
    <QueryBoundary query={query} isEmpty={(options) => options.categorias.length === 0}>{(options) => <TicketForm options={options} />}</QueryBoundary>
  </AppShell>;
}
