export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6" role="alert">
      <p>No se pudo consultar la información. Intentá nuevamente.</p>
      <button type="button" onClick={onRetry} className="mt-4 min-h-10 rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Reintentar
      </button>
    </div>
  );
}
