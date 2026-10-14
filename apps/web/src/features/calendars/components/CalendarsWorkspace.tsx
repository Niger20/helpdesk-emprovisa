import { QueryBoundary } from '../../../components/common/QueryBoundary';
import type { useCalendars } from '../hooks/useCalendars';
import { CalendarForm } from './CalendarForm';
import { CalendarBinding } from './CalendarBinding';

export function CalendarsWorkspace({ state }: { state: ReturnType<typeof useCalendars> }) {
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><button className="min-h-10 rounded border border-input px-3" onClick={() => state.select(null)}>Nuevo calendario</button>
    <button className="min-h-10 rounded border border-input px-3" onClick={() => { state.select(null); void state.list.refetch(); void state.sites.refetch(); }}>Recargar</button></div>
    <QueryBoundary query={state.list} isEmpty={(data) => data.data.length === 0}>{(data) => <ul className="space-y-2">{data.data.map((calendar) => <li key={calendar.idCalendario} className="rounded border border-border bg-card p-3">
      <button className="min-h-10 text-primary underline" onClick={() => state.select(calendar)}>{calendar.nombre}</button>
      <p className="text-sm text-muted">Sedes: {calendar.sedes.map((site) => site.nombre).join(', ') || 'Sin sedes asignadas'} · {calendar.horarios.length} intervalos · {calendar.feriados.length} feriados</p>
    </li>)}</ul>}</QueryBoundary>
    <div className="flex flex-wrap items-center gap-3 text-sm"><button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={state.page <= 1 || state.list.isFetching} onClick={() => state.setPage(state.page - 1)}>Anterior</button>
      <span>Página {state.page} · {state.list.data?.meta.total ?? 0} calendarios</span>
      <button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={!state.list.data || state.page * state.list.data.meta.pageSize >= state.list.data.meta.total || state.list.isFetching} onClick={() => state.setPage(state.page + 1)}>Siguiente</button></div>
    {state.notice && <p role="status" className="text-sm">{state.notice}</p>}
    <CalendarForm key={JSON.stringify(state.selected)} selected={state.selected} saved={state.saved} />
    {state.selected && <CalendarBinding key={state.selected.idCalendario} calendar={state.selected} sites={state.sites} />}
  </div>;
}
