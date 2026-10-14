import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from '../components/NotificationList';
import { AutomationStatus } from '../components/AutomationStatus';
import { SurveyInvitations } from '../components/SurveyInvitations';

export function NotificationsPage() {
  const state = useNotifications();
  return <AppShell><div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">Avisos</h1><p className="mt-1 text-sm text-muted">En esta demostración las entregas se simulan y se consultan aquí.</p></header>
    <QueryBoundary query={state.invitations} isEmpty={(data) => data.data.length === 0}>{(data) => <SurveyInvitations data={data} />}</QueryBoundary>
    <QueryBoundary query={state.query} isEmpty={(data) => data.data.length === 0}>{(data) => <NotificationList data={data} onPage={state.setPage} />}</QueryBoundary>
    {state.canAudit && <QueryBoundary query={state.tasks} isEmpty={(data) => data.tareas.length === 0}>{(data) => <AutomationStatus data={data} />}</QueryBoundary>}
  </div></AppShell>;
}
