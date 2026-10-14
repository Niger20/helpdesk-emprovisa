export function TableSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6" role="status" aria-label="Cargando información">
      <span className="sr-only">Cargando información…</span>
      <div className="h-5 w-1/3 rounded bg-border" />
      <div className="h-8 w-2/3 rounded bg-border" />
      <div className="h-5 w-full rounded bg-border" />
    </div>
  );
}
