import type { Calendar } from '@helpdesk/contracts';
import type { useCalendars } from '../hooks/useCalendars';
import { useCalendarBinding } from '../hooks/useCalendarBinding';
import { QueryBoundary } from '../../../components/common/QueryBoundary';

export function CalendarBinding({ calendar, sites }: { calendar: Calendar; sites: ReturnType<typeof useCalendars>['sites'] }) {
  const state = useCalendarBinding(calendar.idCalendario);
  return <section className="space-y-3 rounded border border-border bg-card p-4"><h2 className="font-semibold">Asignar a una sede</h2>
    <QueryBoundary query={sites} isEmpty={(data) => data.length === 0}>{(data) => <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault(); const site = data.find((item) => String(item.idSede) === state.selected); if (site) state.mutation.mutate(site);
    }}>
      <label className="text-sm">Sede<select required value={state.selected} onChange={(event) => state.select(event.target.value)} className="mt-1 block min-h-10 rounded border border-input bg-card px-3"><option value="">Seleccioná una sede</option>
        {data.filter((site) => site.idCalendario !== calendar.idCalendario).map((site) => <option key={site.idSede} value={site.idSede}>{site.nombre}</option>)}</select></label>
      <button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={!state.selected || state.mutation.isPending}>Asignar calendario</button>
    </form>}</QueryBoundary>
    {state.mutation.error && <p role="alert" className="text-danger">{state.mutation.error.message}</p>}
    {state.mutation.isSuccess && <p role="status">Calendario asignado; los ciclos anteriores conservan su configuración.</p>}
  </section>;
}
