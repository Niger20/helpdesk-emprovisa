import type { ReactNode } from 'react';

export function EmptyState({ title = 'No hay información disponible.', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <section className="space-y-3 rounded-lg border border-border bg-card p-6">
    <div role="status"><p className="font-semibold">{title}</p>{description && <p className="mt-2 text-sm text-muted">{description}</p>}</div>
    {action}
  </section>;
}
