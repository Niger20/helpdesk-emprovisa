import type { z } from 'zod';
import type { notificationListSchema } from '@helpdesk/contracts';
import { Link } from 'react-router';
import { formatDate } from '../../../lib/format';

export function NotificationList({ data, onPage }: { data: z.infer<typeof notificationListSchema>; onPage: (page: number) => void }) {
  return <section aria-label="Tus avisos" className="space-y-3">
    {data.data.map((notification) => <article key={notification.idNotificacion} className="rounded-lg border border-border bg-card p-4">
      <p className="break-words font-semibold">{notification.asunto}</p>
      <p className="mt-1 text-sm text-muted">{formatDate(notification.encoladaEn)} · {notification.estado === 'ENVIADA' ? 'Entrega simulada' : notification.estado === 'ERROR' ? 'Entrega fallida' : 'Pendiente'} · Intentos: {notification.intentos}</p>
      {notification.numero && <Link to={`/tickets/${notification.numero}`} className="mt-2 inline-block min-h-10 py-2 text-primary underline">Ver {notification.numero}</Link>}
    </article>)}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button disabled={data.meta.page === 1} onClick={() => onPage(data.meta.page - 1)} className="min-h-10 rounded border border-border px-4 disabled:opacity-50">Anterior</button>
      <p className="text-sm">Página {data.meta.page} · {data.meta.total} avisos</p>
      <button disabled={data.meta.page * data.meta.pageSize >= data.meta.total} onClick={() => onPage(data.meta.page + 1)} className="min-h-10 rounded border border-border px-4 disabled:opacity-50">Siguiente</button>
    </div>
  </section>;
}
