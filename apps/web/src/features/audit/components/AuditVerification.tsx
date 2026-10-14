import type { z } from 'zod';
import type { auditIntegritySchema } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';

export function AuditVerification({ pending, data, error, onVerify }: { pending: boolean; data: z.infer<typeof auditIntegritySchema> | undefined; error: Error | null; onVerify: () => void }) {
  return <section className="space-y-3 rounded-lg border border-border bg-card p-4" aria-label="Verificar integridad">
    <h2 className="font-semibold">Integridad de las cadenas</h2><p className="text-sm text-muted">Comprueba todos los registros y sus enlaces; el resultado corresponde al momento de la consulta.</p>
    <button disabled={pending} onClick={onVerify} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{pending ? 'Verificando…' : 'Verificar ambas cadenas'}</button>
    {error && <p role="alert" className="text-sm text-danger">{error.message} Podés reintentar la verificación.</p>}
    {data && <div role="status" className="space-y-1 text-sm"><p>{formatDate(data.verificadaEn)}</p><p>Tickets: {data.bitacora.valida ? 'Íntegra' : 'Alteración detectada'} · {data.bitacora.registros} registros</p>
      <p>Sistema: {data.sistema.valida ? 'Íntegra' : 'Alteración detectada'} · {data.sistema.registros} registros</p></div>}
  </section>;
}
