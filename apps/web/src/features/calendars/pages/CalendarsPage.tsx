import { AppShell } from '../../../app/layouts/AppShell/AppShell';
import { useCalendars } from '../hooks/useCalendars';
import { CalendarsWorkspace } from '../components/CalendarsWorkspace';

export default function CalendarsPage() {
  const state = useCalendars();
  return <AppShell><main className="space-y-5 p-4 sm:p-6"><h1 className="text-2xl font-bold">Calendarios y feriados</h1>
    <p className="text-sm text-muted">Configurá las horas laborales y los días excluidos de los SLA laborales. P1 y P2 siguen en horario continuo.</p>
    <CalendarsWorkspace state={state} /></main></AppShell>;
}
