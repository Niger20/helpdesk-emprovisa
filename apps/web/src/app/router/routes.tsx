import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { TableSkeleton } from '../../components/common/TableSkeleton';
import { RequireAuth } from './guards/RequireAuth';
import { loadLoginPage } from '../../features/auth';
import { loadTicketQueuePage, loadNewTicketPage, loadTicketDetailPage } from '../../features/tickets';
import { loadAssetListPage, loadAssetDetailPage } from '../../features/assets';
import { loadKnowledgeListPage, loadKnowledgeDetailPage } from '../../features/knowledge-base';
import { RequirePermission } from './guards/RequirePermission';
import { loadNotificationsPage } from '../../features/notifications';
import { loadReportsPage } from '../../features/reports';

const AvailabilityPage = lazy(() => import('../../features/admin').then((feature) => ({ default: feature.AvailabilityPage })));
const LoginPage = lazy(() => loadLoginPage().then((feature) => ({ default: feature.LoginPage })));
const TicketQueuePage = lazy(() => loadTicketQueuePage().then((feature) => ({ default: feature.TicketQueuePage })));
const NewTicketPage = lazy(() => loadNewTicketPage().then((feature) => ({ default: feature.NewTicketPage })));
const TicketDetailPage = lazy(() => loadTicketDetailPage().then((feature) => ({ default: feature.TicketDetailPage })));
const AssetListPage = lazy(() => loadAssetListPage().then((feature) => ({ default: feature.AssetListPage })));
const AssetDetailPage = lazy(() => loadAssetDetailPage().then((feature) => ({ default: feature.AssetDetailPage })));
const KnowledgeListPage = lazy(loadKnowledgeListPage);
const KnowledgeDetailPage = lazy(loadKnowledgeDetailPage);
const NotificationsPage = lazy(loadNotificationsPage);
const ReportsPage = lazy(() => loadReportsPage().then((page) => ({ default: page.ReportsPage })));
const SurveyPage = lazy(() => import('../../features/surveys').then((feature) => ({ default: feature.SurveyPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/encuesta" element={<SurveyPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/tickets" element={<TicketQueuePage />} />
          <Route path="/tickets/nuevo" element={<NewTicketPage />} />
          <Route path="/tickets/:numero" element={<TicketDetailPage />} />
          <Route path="/activos" element={<RequirePermission permiso="activo.ver"><AssetListPage /></RequirePermission>} />
          <Route path="/activos/:codigoPatrimonial" element={<RequirePermission permiso="activo.ver"><AssetDetailPage /></RequirePermission>} />
          <Route path="/conocimientos" element={<RequirePermission permiso="kb.ver"><KnowledgeListPage /></RequirePermission>} />
          <Route path="/conocimientos/:idArticulo" element={<RequirePermission permiso="kb.ver"><KnowledgeDetailPage /></RequirePermission>} />
          <Route path="/disponibilidad" element={<AvailabilityPage />} />
          <Route path="/avisos" element={<NotificationsPage />} />
          <Route path="/reportes" element={<RequirePermission permiso="reporte.ver"><ReportsPage /></RequirePermission>} />
        </Route>
        <Route path="*" element={<p className="p-8">La página solicitada no existe.</p>} />
      </Routes>
    </Suspense>
  );
}
