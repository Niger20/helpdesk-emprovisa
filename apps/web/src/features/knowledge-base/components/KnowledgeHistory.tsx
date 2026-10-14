import type { KnowledgeDetail } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';

export function KnowledgeHistory({ versions }: { versions: KnowledgeDetail['versiones'] }) {
  if (!versions.length) return null;
  return <section className="space-y-3 rounded-lg border border-border bg-card p-5" aria-label="Historial de versiones">
    <h2 className="text-lg font-semibold">Historial de versiones</h2>
    {versions.map((version) => <details key={version.numeroVersion} className="rounded border border-border p-3">
      <summary className="min-h-10 cursor-pointer break-words font-semibold">Versión {version.numeroVersion} · {formatDate(version.fechaEdicion)}</summary>
      <p className="my-2 text-sm">{version.editadoPor} · {version.motivoCambio ?? 'Sin motivo registrado'}</p>
      <h3 className="break-words font-semibold">{version.titulo}</h3><p className="mt-2 whitespace-pre-wrap break-words">{version.contenido}</p>
    </details>)}
  </section>;
}
