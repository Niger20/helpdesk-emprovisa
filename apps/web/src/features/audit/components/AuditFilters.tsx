import type { AuditQuery } from '@helpdesk/contracts';
import { DateInput } from '../../../components/common/DateInput';

export function AuditFilters({ draft, onChange, onApply, error }: { draft: AuditQuery; onChange: (value: AuditQuery) => void; onApply: () => void; error: string | null }) {
  return <form onSubmit={(event) => { event.preventDefault(); onApply(); }} className="space-y-3 rounded-lg border border-border bg-card p-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm">Tipo de evidencia<select value={draft.clase} onChange={(event) => onChange({ ...draft, clase: event.target.value === 'SISTEMA' ? 'SISTEMA' : 'BITACORA', numero: undefined, entidad: undefined })} className="mt-1 min-h-10 w-full rounded border border-border px-3"><option value="BITACORA">Eventos de tickets</option><option value="SISTEMA">Eventos del sistema</option></select></label>
      {(['desde', 'hasta'] as const).map((key) => <DateInput key={key} label={key === 'desde' ? 'Desde' : 'Hasta'} value={draft[key]} onChange={(value) => onChange({ ...draft, [key]: value })} />)}
      <label className="text-sm">Acción<input value={draft.accion ?? ''} onChange={(event) => onChange({ ...draft, accion: event.target.value || undefined })} placeholder="Por ejemplo: ASIGNACION" maxLength={50} className="mt-1 min-h-10 w-full rounded border border-border px-3" /></label>
      {draft.clase === 'BITACORA' ? <label className="text-sm">Ticket<input value={draft.numero ?? ''} onChange={(event) => onChange({ ...draft, numero: event.target.value || undefined })} placeholder="TK-000001" className="mt-1 min-h-10 w-full rounded border border-border px-3" /></label>
        : <label className="text-sm">Entidad<input value={draft.entidad ?? ''} onChange={(event) => onChange({ ...draft, entidad: event.target.value || undefined })} placeholder="Por ejemplo: usuarios" maxLength={50} className="mt-1 min-h-10 w-full rounded border border-border px-3" /></label>}
    </div><button className="min-h-10 rounded bg-primary px-4 text-primary-foreground">Consultar</button>
    <p className="text-xs text-muted">Los eventos del sistema y la verificación requieren acceso a todas las sedes.</p>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </form>;
}
