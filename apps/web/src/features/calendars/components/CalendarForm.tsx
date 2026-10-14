import type { Calendar } from '@helpdesk/contracts';
import { useCalendarForm } from '../hooks/useCalendarForm';
import { WorkHoursEditor } from './WorkHoursEditor';
import { HolidaysEditor } from './HolidaysEditor';

export function CalendarForm({ selected, saved }: { selected: Calendar | null; saved: (calendar: Calendar) => void }) {
  const state = useCalendarForm(selected, saved);
  return <form className="space-y-5 rounded border border-border bg-card p-4" onSubmit={(event) => { void state.submit(event); }}>
    <h2 className="text-lg font-semibold">{selected ? 'Editar calendario' : 'Nuevo calendario'}</h2>
    <label className="block text-sm">Nombre<input maxLength={60} required className="mt-1 block min-h-10 w-full rounded border border-input px-3" {...state.form.register('nombre')} /></label>
    <p className="text-sm text-muted">Zona horaria: America/Managua. Los cambios rigen para tickets nuevos y nuevos ciclos al reabrir o rechazar una solución.</p>
    <WorkHoursEditor state={state} /><HolidaysEditor state={state} />
    {state.form.formState.errors.nombre && <p role="alert" className="text-danger">Ingresá un nombre de hasta 60 caracteres.</p>}
    {state.mutation.error && <p role="alert" className="text-danger">{state.mutation.error.message}</p>}
    <button disabled={state.mutation.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{state.mutation.isPending ? 'Guardando…' : 'Guardar calendario'}</button>
  </form>;
}
