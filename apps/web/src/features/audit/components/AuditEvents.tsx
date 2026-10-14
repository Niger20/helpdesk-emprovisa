import type { z } from 'zod';
import type { auditListSchema } from '@helpdesk/contracts';
import { Link } from 'react-router';
import { formatDate } from '../../../lib/format';

export function AuditEvents({ result, onPage }: { result: z.infer<typeof auditListSchema>; onPage: (page: number) => void }) {
  return <section aria-label="Evidencia encontrada" className="space-y-3">{result.data.map((event) => <article key={event.idRegistro} className="rounded-lg border border-border bg-card p-4 text-sm">
    <p className="font-semibold">{event.accion.replaceAll('_', ' ')} · {event.entidad}</p>
    <p className="mt-1">{formatDate(event.fechaHora)} · {event.actor} · {event.automatica ? 'Acción automática' : 'Acción humana'}</p>
    {event.numero && <Link to={`/tickets/${event.numero}`} className="inline-block min-h-10 py-2 text-primary underline">{event.numero}</Link>}
    <p className="text-muted">{event.resultado ?? 'Evento registrado'} · Origen: {event.direccionIp ?? 'Sin IP registrada'}{event.tarea && ` · Tarea: ${event.tarea}`}</p>
    <details className="mt-2"><summary className="min-h-10 cursor-pointer py-2">Evidencia de integridad</summary>
      <dl className="space-y-2"><div><dt className="font-semibold">Hash anterior</dt><dd className="break-all font-mono text-xs">{event.hashPrevio}</dd></div>
        <div><dt className="font-semibold">Hash del registro</dt><dd className="break-all font-mono text-xs">{event.hashRegistro}</dd></div></dl>
    </details>
  </article>)}<div className="grid grid-cols-2 items-center gap-2">
    <span className="col-span-2 text-center">Página {result.meta.page} · {result.meta.total} registros</span>
    <button disabled={result.meta.page === 1} onClick={() => onPage(result.meta.page - 1)} className="min-h-10 rounded border border-border px-4 disabled:opacity-50">Anterior</button>
    <button disabled={result.meta.page * result.meta.pageSize >= result.meta.total} onClick={() => onPage(result.meta.page + 1)} className="min-h-10 rounded border border-border px-4 disabled:opacity-50">Siguiente</button>
  </div></section>;
}
