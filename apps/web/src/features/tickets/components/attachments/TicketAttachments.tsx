import type { EstadoTicket } from '@helpdesk/contracts';
import { QueryBoundary } from '../../../../components/common/QueryBoundary';
import { useTicketAttachments } from '../../hooks/useTicketAttachments';
import { attachmentUrl } from '../../api/attachments.api';
import { formatDate } from '../../../../lib/format';
import { EmptyState } from '../../../../components/common/EmptyState';

interface Props { numero: string; estado: EstadoTicket }
export function TicketAttachments({ numero, estado }: Props) {
  const { query, upload, form, select, submit, inputKey, canUpload } = useTicketAttachments(numero, estado);
  return <section aria-labelledby="ticket-adjuntos-titulo" className="rounded-lg border border-border bg-card p-5">
    <h2 id="ticket-adjuntos-titulo" className="mb-4 text-lg font-semibold">Archivos adjuntos</h2>
    <QueryBoundary query={query} isEmpty={(data) => data.data.length === 0} emptyState={<EmptyState title="Este ticket no tiene archivos adjuntos."
      description={canUpload ? 'Podés seleccionar evidencia en JPG, PNG o PDF y adjuntarla a continuación.' : 'Las evidencias que se adjunten al ticket aparecerán aquí.'} />}>{(data) => <ul className="space-y-3">
      {data.data.map((file) => <li key={file.idAdjunto} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3">
        <div className="min-w-0"><p className="break-all font-medium">{file.nombreOriginal}</p>
          <p className="text-sm text-muted">{(file.tamanoBytes / 1024).toFixed(1)} KB · {formatDate(file.fechaSubida)}</p></div>
        {data.puedeDescargar && <a href={attachmentUrl(numero, file.idAdjunto)} download className="inline-flex min-h-10 items-center rounded border border-input px-3 text-sm">Descargar<span className="sr-only"> {file.nombreOriginal}</span></a>}
      </li>)}
    </ul>}</QueryBoundary>
    {canUpload && query.isSuccess && <form className="mt-5 space-y-3" noValidate onSubmit={(event) => { void submit(event); }}>
      <div className="space-y-2 text-sm">
        <input key={inputKey} id="ticket-adjunto-archivo" type="file" accept="image/jpeg,image/png,application/pdf" disabled={upload.isPending}
          className="peer sr-only" onChange={(event) => select(event.target.files?.[0])}
          aria-invalid={Boolean(form.formState.errors.archivo)} aria-describedby="ticket-adjunto-ayuda ticket-adjunto-error" />
        <label htmlFor="ticket-adjunto-archivo" className="inline-flex min-h-10 cursor-pointer items-center rounded border border-input px-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-focus-visible:ring-2 peer-focus-visible:ring-card peer-disabled:opacity-50">Seleccionar archivo de evidencia</label>
        <p role="status" className="break-all">{form.watch('archivo')?.name ?? 'Ningún archivo seleccionado.'}</p>
      </div>
      <p id="ticket-adjunto-ayuda" className="text-sm text-muted">JPG, PNG o PDF · máximo {(query.data.maximoBytes / 1048576).toFixed(1)} MB por archivo. El adjunto será visible para quienes puedan consultar el ticket.</p>
      <p id="ticket-adjunto-error" role="alert" className="text-sm text-danger">{form.formState.errors.archivo?.message ?? upload.error?.message}</p>
      {upload.isSuccess && <p role="status" className="text-sm">Archivo adjuntado correctamente.</p>}
      <button type="submit" disabled={upload.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{upload.isPending ? 'Guardando…' : 'Adjuntar archivo'}</button>
    </form>}
  </section>;
}
