import type { Ticket } from '@helpdesk/contracts';
import { formatDate } from '../../../../lib/format';
import { slaLabel } from '../../lib/slaLabel';
import { Link } from 'react-router';

export function TicketHeader({ ticket }: { ticket: Ticket }) {
  return <section className="mb-6 rounded-lg border border-border bg-card p-5">
    <p className="text-sm font-semibold text-primary">{ticket.numero}</p><h1 className="mt-2 text-2xl font-bold">{ticket.titulo}</h1>
    {ticket.numeroTicketOrigen && <Link to={`/tickets/${ticket.numeroTicketOrigen}`} className="inline-flex min-h-10 items-center text-sm text-primary underline">Caso de origen: {ticket.numeroTicketOrigen}</Link>}
    <div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="rounded bg-background px-3 py-2">{ticket.estado.replaceAll('_', ' ')}</span><span className="rounded bg-background px-3 py-2">{ticket.prioridad}</span><span className="rounded bg-background px-3 py-2">SLA: {slaLabel(ticket)}</span></div>
    <p className="mt-4 whitespace-pre-wrap">{ticket.descripcion}</p>
    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Solicitante y sede</dt><dd>{ticket.solicitante} · {ticket.sede}</dd></div>
    <div><dt className="font-semibold">Categoría y activo</dt><dd>{ticket.categoria} · {ticket.activo ?? 'Sin activo'}</dd></div>
    <div><dt className="font-semibold">Límite de respuesta</dt><dd>{formatDate(ticket.fechaLimiteRespuesta)}</dd></div>
    <div><dt className="font-semibold">Límite de solución</dt><dd>{formatDate(ticket.fechaLimiteSolucion)}</dd></div></dl>
  </section>;
}
