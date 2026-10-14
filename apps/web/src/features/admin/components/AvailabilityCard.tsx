import type { HealthResponse } from '@helpdesk/contracts';

export function AvailabilityCard({ health }: { health: HealthResponse }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6" aria-label="Disponibilidad del sistema">
      <p className="text-sm font-semibold text-primary">Estado del servicio</p>
      <h2 className="mt-2 text-2xl font-bold">{health.estado === 'DISPONIBLE' ? 'Sistema disponible' : 'Sistema no disponible'}</h2>
      <p className="mt-3 text-muted">{health.estado === 'DISPONIBLE'
        ? 'La API local y sus conexiones de consulta responden. Podés abrir la mesa de ayuda.'
        : 'No se pudo confirmar la disponibilidad de la API local y sus conexiones de consulta.'}</p>
    </section>
  );
}
