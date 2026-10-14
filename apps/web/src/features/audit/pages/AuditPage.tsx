import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useAudit } from '../hooks/useAudit';
import { AuditFilters } from '../components/AuditFilters';
import { AuditEvents } from '../components/AuditEvents';
import { AuditVerification } from '../components/AuditVerification';

export function AuditPage() {
  const state = useAudit();
  return <AppShell><div className="space-y-5"><header><h1 className="text-2xl font-semibold">Auditoría</h1><p className="mt-1 text-sm text-muted">Evidencia inalterable de tickets y operaciones del sistema.</p></header>
    <AuditFilters draft={state.draft} onChange={state.setDraft} onApply={state.apply} error={state.error} />
    {state.canVerify && <AuditVerification pending={state.verification.isPending} data={state.verification.data} error={state.verification.error} onVerify={() => state.verification.mutate()} />}
    <QueryBoundary query={state.query} isEmpty={(data) => data.data.length === 0}>{(result) => <AuditEvents result={result} onPage={state.changePage} />}</QueryBoundary>
  </div></AppShell>;
}
