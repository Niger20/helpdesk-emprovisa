interface Props { pending: boolean; error: Error | null; success: boolean; invalid?: boolean }
export function FormFeedback({ pending, error, success, invalid }: Props) {
  return <div aria-live="polite" className="space-y-2 text-sm">
    {invalid && <p className="text-danger">Revisá los campos y las fechas ingresadas.</p>}
    {error && <p role="alert" className="text-danger">{error.message}</p>}
    {success && <p>Los cambios se guardaron.</p>}
    <button type="submit" disabled={pending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar cambios'}</button>
  </div>;
}
