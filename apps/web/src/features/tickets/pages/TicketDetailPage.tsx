import { Link } from 'react-router';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useTicket } from '../hooks/useTicket';
import { TicketHeader } from '../components/detail/TicketHeader';
import { TicketTimeline } from '../components/detail/TicketTimeline';
import { ActionsPanel } from '../components/detail/ActionsPanel';
import { LifecyclePanel } from '../components/lifecycle/LifecyclePanel';
import { TicketAttachments } from '../components/attachments/TicketAttachments';

export function TicketDetailPage() {
  const query = useTicket();
  return <AppShell><Link to="/tickets" className="mb-5 inline-flex min-h-10 items-center text-sm text-primary underline">Volver a la cola</Link>
    <QueryBoundary query={query} isEmpty={() => false}>{(detail) => <><TicketHeader ticket={detail.ticket} /><TicketTimeline detail={detail} /><div className="mt-6"><ActionsPanel numero={detail.ticket.numero} /></div><LifecyclePanel numero={detail.ticket.numero} /><div className="mt-6"><TicketAttachments numero={detail.ticket.numero} estado={detail.ticket.estado} /></div></>}</QueryBoundary>
  </AppShell>;
}
