import type { CalendarFormState } from '../hooks/useCalendarForm';

export function HolidaysEditor({ state }: { state: CalendarFormState }) {
  const field = 'min-h-10 rounded border border-input bg-card px-2';
  return <fieldset className="space-y-3"><legend className="font-semibold">Feriados</legend>
    {state.holidays.fields.length === 0 && <p className="text-sm text-muted">Sin feriados configurados.</p>}
    {state.holidays.fields.map((day, index) => <div key={day.id} className="flex flex-wrap items-end gap-2 text-sm">
      <label>Fecha<input type="date" required className={`block ${field}`} {...state.form.register(`feriados.${index}.fecha`)} /></label>
      <label>Descripción<input maxLength={100} required className={`block ${field}`} {...state.form.register(`feriados.${index}.descripcion`)} /></label>
      <button type="button" className={field} onClick={() => state.holidays.remove(index)} aria-label={`Quitar feriado ${index + 1}`}>Quitar</button>
    </div>)}
    <button type="button" className={`${field} disabled:opacity-50`} disabled={state.holidays.fields.length >= 1000} onClick={() => state.holidays.append({ fecha: '', descripcion: '' })}>Agregar feriado</button>
    {state.form.formState.errors.feriados && <p role="alert" className="text-sm text-danger">Revisá fechas y descripciones; no se permiten fechas repetidas.</p>}
  </fieldset>;
}
