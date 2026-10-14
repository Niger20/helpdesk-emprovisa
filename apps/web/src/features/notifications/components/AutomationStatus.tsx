import type { z } from 'zod';
import type { automationStatusSchema } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';

const names = { 'sla-threshold': 'Alertas de plazo', 'sla-breach-escalation': 'Escalamiento por falta de atención',
  'auto-close-resolved': 'Cierre por inactividad', 'mail-ingest': 'Recepción de correo simulada', 'notification-dispatch': 'Entrega de avisos simulada', 'audit-chain-verify': 'Verificación de bitácora' };
export function AutomationStatus({ data }: { data: z.infer<typeof automationStatusSchema> }) {
  return <section className="space-y-3" aria-label="Tareas automáticas">
    <h2 className="text-lg font-semibold">Tareas automáticas</h2>
    <p className="text-sm text-muted">Avisos pendientes: {data.notificaciones.pendientes} · Entregados: {data.notificaciones.enviadas} · Fallidos: {data.notificaciones.fallidas}</p>
    <ul className="grid gap-3 sm:grid-cols-2">{data.tareas.map((task) => <li key={task.codigo} className="rounded-lg border border-border bg-card p-4">
      <p className="font-semibold">{names[task.codigo]}</p>
      <p className="mt-1 text-sm">{task.activa ? 'Activa' : 'Desactivada'} · {task.ultimoResultado ?? 'Sin ejecución'}</p>
      <p className="mt-1 text-sm text-muted">Última ejecución: {task.ultimaEjecucion ? formatDate(task.ultimaEjecucion) : 'Pendiente'}</p>
    </li>)}</ul>
  </section>;
}
