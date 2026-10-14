import type { Reports } from '@helpdesk/contracts';
import { reportNumber } from '../lib/format';
export function ReportBreakdowns({ report }: { report: Reports }) {
  const groups = [{ title: 'Por estado', data: report.porEstado }, { title: 'Por prioridad', data: report.porPrioridad }, { title: 'Por sede', data: report.porSede }];
  return <section aria-label="Desglose del reporte" className="grid gap-4 lg:grid-cols-3">
    {groups.map((group) => <article key={group.title} className="rounded-lg border border-border bg-card p-4"><h2 className="mb-3 font-semibold">{group.title}</h2>
      <dl className="space-y-2">{group.data.map((value) => <div key={value.etiqueta} className="flex justify-between gap-3"><dt className="break-words">{value.etiqueta.replaceAll('_', ' ')}</dt><dd>{value.total}</dd></div>)}</dl>
    </article>)}
    <article className="rounded-lg border border-border bg-card p-4"><h2 className="mb-3 font-semibold">SLA por prioridad</h2><ul className="space-y-2 text-sm">
      {report.slaPorPrioridad.map((value) => <li key={value.etiqueta}>{value.etiqueta}: {reportNumber(value.porcentaje, '%')} ({value.cumplidos}/{value.resueltos} resueltos; {value.evaluados} evaluados)</li>)}
    </ul></article>
    <article className="rounded-lg border border-border bg-card p-4 lg:col-span-2"><h2 className="mb-1 font-semibold">Carga por analista</h2><p className="mb-3 text-xs text-muted">Asignación actual de los tickets del período.</p>
      <ul className="space-y-2 text-sm">{report.cargaPorAnalista.map((value) => <li key={value.analista} className="flex flex-wrap justify-between gap-2"><span>{value.analista}</span><span>{value.abiertos} abiertos · {value.resueltos} resueltos</span></li>)}</ul>
    </article>
  </section>;
}
