import type { SlaSettings } from '@helpdesk/contracts';

export function SlaMatrix({ entries }: { entries: SlaSettings['matriz'] }) {
  return <section className="space-y-3" aria-labelledby="sla-matrix-title"><h2 id="sla-matrix-title" className="text-xl font-semibold">Matriz de impacto y urgencia</h2>
    <dl className="grid gap-3 sm:grid-cols-3">{entries.map((entry) => <div key={`${entry.impacto}:${entry.urgencia}`} className="rounded border border-border bg-card p-4">
      <dt className="text-sm">Impacto {entry.impacto.toLowerCase()} · urgencia {entry.urgencia.toLowerCase()}</dt>
      <dd className="mt-2 font-semibold">{entry.prioridad} · {entry.cumpleNormativa ? 'Cumple la norma' : `Norma: ${entry.prioridadNormativa}`}</dd>
    </div>)}</dl>
  </section>;
}
