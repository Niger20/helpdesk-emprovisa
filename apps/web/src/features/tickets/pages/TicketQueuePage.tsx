import { Link } from 'react-router';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useAuth } from '../../../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import { TicketFilters } from '../components/queue/TicketFilters';
import { TicketQueue } from '../components/queue/TicketQueue';

export function TicketQueuePage() {
  const { query, params, changeFilter } = useTickets();
  const session = useAuth();
  return <AppShell><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Tickets</h1>
    {session.data?.usuario.permisos.includes('ticket.crear') && <Link to="/tickets/nuevo" className="min-h-10 rounded bg-primary px-4 py-2 text-primary-foreground">Nuevo requerimiento</Link>}</div>
    <TicketFilters params={params} onChange={changeFilter} />
    <QueryBoundary query={query} isEmpty={(result) => result.data.length === 0}>{(result) => <TicketQueue result={result} onPage={(page) => changeFilter('page', page)} />}</QueryBoundary>
  </AppShell>;
}
