import type { TicketComment } from '@helpdesk/contracts';
import { useReplyForm } from '../../hooks/useReplyForm';

interface Props { version: number; internal: boolean; pending: boolean; error: string | undefined; send: (data: TicketComment, onSuccess: () => void) => void }
export function ReplyBox({ version, internal, pending, error, send }: Props) {
  const { form, submit } = useReplyForm(version, send);
  return <section aria-labelledby="responder-ticket" className="rounded-lg border border-border bg-card p-5">
    <h2 id="responder-ticket" className="mb-4 text-lg font-semibold">Agregar respuesta</h2>
    <form noValidate onSubmit={(event) => { void submit(event); }}>
      <fieldset disabled={pending} className="space-y-4"><legend className="sr-only">Mensaje del ticket</legend>
        <label className="block text-sm" htmlFor="respuesta-visibilidad">Visibilidad<select id="respuesta-visibilidad" className="mt-1 min-h-10 w-full rounded border border-input bg-card px-3" {...form.register('visibilidad')}>
          <option value="PUBLICO">Respuesta pública · visible para el solicitante</option>{internal && <option value="INTERNO">Nota interna · solo equipo de TI y auditor</option>}</select></label>
        <label className="block text-sm" htmlFor="respuesta-contenido">Mensaje<textarea id="respuesta-contenido" className="mt-1 min-h-28 w-full rounded border border-input p-3" maxLength={8000}
          {...form.register('contenido')} aria-invalid={Boolean(form.formState.errors.contenido)} aria-describedby="respuesta-error" />
          <span className="text-danger" id="respuesta-error">{form.formState.errors.contenido?.message}</span></label>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="mt-4 min-h-10 rounded bg-primary px-5 text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : 'Enviar mensaje'}</button>
    </form>
  </section>;
}
