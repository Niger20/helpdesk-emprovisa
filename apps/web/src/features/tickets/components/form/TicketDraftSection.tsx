import { useState } from 'react';
import type { TicketOptions } from '@helpdesk/contracts';
import { TicketDraftContext } from '../../lib/ticketDraftContext';
import type { TicketDraftStatus } from '../../lib/ticketDraftContext';
import { TicketForm } from './TicketForm';

export function TicketDraftSection({ options }: { options: TicketOptions }) {
  const [status, setStatus] = useState<TicketDraftStatus | null>(null);
  return <TicketDraftContext.Provider value={setStatus}>
    <section className="max-w-3xl space-y-4" aria-label="Nuevo requerimiento y borrador">
      <div className="space-y-2 rounded border border-border bg-card p-4 text-sm">
        <p role="status">{status?.message ?? 'Preparando el borrador local…'}</p>
        <p className="text-muted">El borrador se guarda en este navegador para tu usuario durante 24 horas. No incluyás contraseñas ni secretos. No se conservan adjuntos.</p>
        <button type="button" onClick={status?.discard} disabled={!status || status.pending}
          className="min-h-11 rounded border border-input px-4 py-2 font-semibold disabled:opacity-60">Descartar borrador y vaciar formulario</button>
      </div>
      <TicketForm options={options} />
    </section>
  </TicketDraftContext.Provider>;
}
