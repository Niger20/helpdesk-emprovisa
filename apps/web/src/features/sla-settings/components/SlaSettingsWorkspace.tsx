import type { useSlaSettings } from '../hooks/useSlaSettings';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { SlaPriorityForm } from './SlaPriorityForm';
import { SlaMatrix } from './SlaMatrix';

export function SlaSettingsWorkspace({ query }: { query: ReturnType<typeof useSlaSettings> }) {
  return <QueryBoundary query={query} isEmpty={(data) => data.prioridades.length === 0 && data.matriz.length === 0}>{(data) => <div className="space-y-6">
    <p role="status" className="rounded border border-border p-4">{data.cumpleNormativa ? 'La configuración cumple la matriz, plazos y alerta del 50% normativos.' :
      'La configuración presenta diferencias o datos incompletos. Se requiere revisión técnica antes de operar con estos valores.'}</p>
    <SlaMatrix entries={data.matriz} />
    <section className="space-y-3" aria-labelledby="sla-priorities-title"><h2 id="sla-priorities-title" className="text-xl font-semibold">Plazos por prioridad</h2>
      <div className="grid gap-4 lg:grid-cols-2">{data.prioridades.map((priority) => <SlaPriorityForm key={`${priority.codigo}:${data.revision}`} priority={priority} revision={data.revision} />)}</div>
    </section>
  </div>}</QueryBoundary>;
}
