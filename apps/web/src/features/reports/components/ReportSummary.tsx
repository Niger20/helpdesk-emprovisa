import type { Reports } from '@helpdesk/contracts';
import { reportDate, reportNumber } from '../lib/format';
export function ReportSummary({ report }: { report: Reports }) {
  const data = report.resumen;
  const cards = [ ['Tickets del período', String(data.total), `${data.respondidos} con primera respuesta · ${data.resueltos} resueltos`],
    ['MTTA', reportNumber(data.mttaMinutos, ' min'), 'Tiempo hasta primera respuesta / total de tickets'],
    ['MTTR', reportNumber(data.mttrMinutos, ' min'), 'Resolución vigente menos creación y pausas'],
    ['Cumplimiento de SLA', reportNumber(data.cumplimientoSla, '%'), `${data.slaCumplidos} de ${data.resueltos} resueltos · ${data.slaEvaluados} evaluados · meta 85%`],
    ['CSAT (satisfacción)', reportNumber(data.csatPromedio, ' / 5'), `${data.encuestasRespondidas} respuestas · ${reportNumber(data.csatPorcentaje, '%')} · meta 80%`],
  ];
  return <section aria-label="Indicadores ejecutivos" className="space-y-4">
    <p className="text-sm text-muted">Tickets creados del {reportDate(report.filtros.desde)} al {reportDate(report.filtros.hasta)}, America/Managua.</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, detail]) => <article key={label} className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-muted">{label}</h2><p className="my-2 text-2xl font-bold">{value}</p><p className="text-xs text-muted">{detail}</p>
    </article>)}</div>
    <p className="text-xs text-muted">MTTA incluye todos los tickets en el denominador; sin respuesta aportan cero a la suma. SLA usa el resultado guardado al resolver sobre todos los resueltos; sin evaluación no se considera cumplido. Excluye resoluciones previas a la reapertura. CSAT usa encuestas respondidas de esta cohorte.</p>
  </section>;
}
