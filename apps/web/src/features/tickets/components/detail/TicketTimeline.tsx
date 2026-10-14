import type { z } from 'zod';
import type { ticketDetailSchema } from '@helpdesk/contracts';
import { formatDate } from '../../../../lib/format';

export function TicketTimeline({ detail }: { detail: z.infer<typeof ticketDetailSchema> }) {
  return <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-4 text-lg font-bold">Bitácora</h2>
    <ol className="space-y-4">{detail.bitacora.map((event, index) => <li key={`${event.fechaHora}-${index}`} className="border-l-2 border-primary pl-4"><p className="text-sm font-semibold">{event.accion.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-muted">{event.autor ?? 'Sistema'} · {formatDate(event.fechaHora)}</p></li>)}</ol>
  </section><section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-4 text-lg font-bold">Comentarios</h2>
    {detail.comentarios.length === 0 && <p className="text-sm text-muted">Todavía no hay comentarios.</p>}
    <ol className="space-y-4">{detail.comentarios.map((comment, index) => <li key={`${comment.fechaCreacion}-${index}`} className="rounded border border-border p-3"><p className="text-sm font-semibold">{comment.autor ?? 'Sistema'} · {comment.visibilidad === 'INTERNO' ? 'Nota interna' : 'Comentario público'}</p><p className="mt-2 whitespace-pre-wrap text-sm">{comment.contenido}</p><p className="mt-2 text-xs text-muted">{formatDate(comment.fechaCreacion)}</p></li>)}</ol>
  </section></div>;
}
