import type { CalendarFormState } from '../hooks/useCalendarForm';

export function WorkHoursEditor({ state }: { state: CalendarFormState }) {
  const field = 'min-h-10 rounded border border-input bg-card px-2';
  return <fieldset className="space-y-3"><legend className="font-semibold">Horarios laborales</legend>
    <p className="text-sm text-muted">Lunes a viernes; podés dividir un día en varios intervalos sin superposición.</p>
    {state.hours.fields.map((hour, index) => <div key={hour.id} className="flex flex-wrap items-end gap-2 text-sm">
      <label>Día<select className={`block ${field}`} {...state.form.register(`horarios.${index}.diaSemana`, { valueAsNumber: true })}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, i) => <option key={day} value={i + 1}>{day}</option>)}</select></label>
      <label>Desde<input type="time" required className={`block ${field}`} {...state.form.register(`horarios.${index}.horaInicio`)} /></label>
      <label>Hasta<input type="time" required className={`block ${field}`} {...state.form.register(`horarios.${index}.horaFin`)} /></label>
      <button type="button" className={`${field} disabled:opacity-50`} disabled={state.hours.fields.length <= 1} onClick={() => state.hours.remove(index)} aria-label={`Quitar horario ${index + 1}`}>Quitar</button>
    </div>)}
    <button type="button" className={`${field} disabled:opacity-50`} disabled={state.hours.fields.length >= 35} onClick={() => state.hours.append({ diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' })}>Agregar intervalo</button>
    {state.form.formState.errors.horarios && <p role="alert" className="text-sm text-danger">Revisá días, horas y superposiciones. Debe quedar al menos un intervalo laboral.</p>}
  </fieldset>;
}
