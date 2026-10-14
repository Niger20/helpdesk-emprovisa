import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { AvailabilityCard } from '../components/AvailabilityCard';
import { useHealth } from '../hooks/useHealth';
import { SessionPanel } from '../../auth';

export function AvailabilityPage() {
  const query = useHealth();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="bg-primary px-6 py-8 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-widest">EMPROVISA</p>
          <h1 className="mt-2 text-3xl font-bold">Sistema de Mesa de Ayuda</h1>
          <p className="mt-3 text-sm">Managua · Rivas · León</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl p-6">
        <SessionPanel />
        <QueryBoundary query={query} isEmpty={() => false}>
          {(health) => <AvailabilityCard health={health} />}
        </QueryBoundary>
      </div>
    </main>
  );
}
