import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { EmptyState } from '../../../components/common/EmptyState';
import { Link } from 'react-router';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from '../components/NotificationList';
import { AutomationStatus } from '../components/AutomationStatus';
import { SurveyInvitations } from '../components/SurveyInvitations';

export function NotificationsPage() {
  const state = useNotifications();
  return <AppShell><div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">Avisos</h1><p className="mt-1 text-sm text-muted">En esta demostración las entregas se simulan y se consultan aquí.</p></header>
    <QueryBoundary query={state.invitations} isEmpty={(data) => data.data.length === 0} emptyState={<EmptyState title="No hay encuestas de satisfacción disponibles."
      description="Las invitaciones vigentes para evaluar tus tickets cerrados aparecerán aquí. Podés consultar el estado de tus tickets."
      action={<Link to="/tickets" className="inline-flex min-h-10 items-center rounded border border-input px-3 text-primary underline">Consultar tickets</Link>} />}>{(data) => <SurveyInvitations data={data} />}</QueryBoundary>
    <QueryBoundary query={state.query} isEmpty={(data) => data.data.length === 0} emptyState={<EmptyState title="No hay avisos para mostrar en esta página."
      description="Los avisos de asignación, comentarios y cambios de estado aparecerán aquí. Podés volver a la primera página para revisar los más recientes."
      action={<button type="button" onClick={() => state.setPage(1)} className="min-h-10 rounded border border-input px-3">Ver avisos recientes</button>} />}>{(data) => <NotificationList data={data} onPage={state.setPage} />}</QueryBoundary>
    {state.canAudit && <QueryBoundary query={state.tasks} isEmpty={(data) => data.tareas.length === 0} emptyState={<EmptyState title="No hay tareas automáticas registradas."
      description="Solicitá a TI que revise el registro de tareas programadas del prototipo local." />}>{(data) => <AutomationStatus data={data} />}</QueryBoundary>}
  </div></AppShell>;
}
