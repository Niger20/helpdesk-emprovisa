import { estadoTicketSchema, prioridadSchema } from '@helpdesk/contracts';

export function TicketFilters({ params, onChange }: { params: URLSearchParams; onChange: (key: string, value: string) => void }) {
  return <div className="mb-5 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
    <label className="text-sm">Buscar<input className="mt-1 min-h-10 w-full rounded border border-input px-3" value={params.get('search') ?? ''} onChange={(event) => onChange('search', event.target.value)} placeholder="Número o título" /></label>
    <label className="text-sm">Estado<select className="mt-1 min-h-10 w-full rounded border border-input px-3" value={params.get('estado') ?? ''} onChange={(event) => onChange('estado', event.target.value)}><option value="">Todos los estados</option>{estadoTicketSchema.options.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
    <label className="text-sm">Prioridad<select className="mt-1 min-h-10 w-full rounded border border-input px-3" value={params.get('prioridad') ?? ''} onChange={(event) => onChange('prioridad', event.target.value)}><option value="">Todas las prioridades</option>{prioridadSchema.options.map((value) => <option key={value}>{value}</option>)}</select></label>
  </div>;
}
