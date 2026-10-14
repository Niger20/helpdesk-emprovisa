import { Link } from 'react-router';
import type { AssetDetail } from '@helpdesk/contracts';
import { incidentDate } from '../../lib/format';

export function AssetIncidents({ incidents }: { incidents: AssetDetail['incidentes'] }) {
  return <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="incidentes-activo">
    <h2 id="incidentes-activo" className="mb-4 text-lg font-semibold">Últimos 5 incidentes visibles</h2>
    {incidents.length === 0 ? <p className="text-sm text-muted">No hay incidentes del equipo disponibles para tu cuenta.</p> :
      <ul className="divide-y divide-border">{incidents.map((incident) => <li key={incident.numero} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><Link to={`/tickets/${incident.numero}`} className="inline-flex min-h-10 items-center font-semibold text-primary underline">{incident.numero}</Link><p className="text-sm">{incident.titulo}</p></div>
        <div className="text-sm"><p>{incident.estado.replaceAll('_', ' ')}</p><time dateTime={incident.fechaCreacion}>{incidentDate(incident.fechaCreacion)}</time></div>
      </li>)}</ul>}
  </section>;
}
