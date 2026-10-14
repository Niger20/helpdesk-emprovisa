import type { AssetDetail } from '@helpdesk/contracts';
import { assetDate, assetStateLabels } from '../../lib/format';

export function AssetCard({ asset }: { asset: AssetDetail }) {
  return <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="ficha-activo">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 id="ficha-activo" className="text-2xl font-semibold">{asset.codigoPatrimonial}</h1>
      <span className="rounded border border-input bg-background px-3 py-1 text-sm font-semibold">{assetStateLabels[asset.estado]}</span></div>
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div><dt className="text-sm text-muted">Tipo de activo</dt><dd>{asset.tipoActivo.nombre}</dd></div>
      <div><dt className="text-sm text-muted">Marca y modelo</dt><dd>{[asset.marca, asset.modelo].filter(Boolean).join(' ') || 'No registrado'}</dd></div>
      <div><dt className="text-sm text-muted">Número de serie</dt><dd>{asset.numeroSerie ?? 'No registrado'}</dd></div>
      <div><dt className="text-sm text-muted">Sede</dt><dd>{asset.sede.nombre}</dd></div>
      <div><dt className="text-sm text-muted">Custodio</dt><dd>{asset.custodio?.nombreCompleto ?? 'Sin custodio'}</dd></div>
      <div><dt className="text-sm text-muted">Acta patrimonial F-ACT-01</dt><dd>{asset.actaNumero}</dd></div>
      <div><dt className="text-sm text-muted">Fecha de adquisición</dt><dd>{assetDate(asset.fechaAdquisicion)}</dd></div>
      <div><dt className="text-sm text-muted">Garantía hasta</dt><dd>{assetDate(asset.garantiaHasta)}</dd></div>
      <div className="sm:col-span-2 lg:col-span-3"><dt className="text-sm text-muted">Descripción</dt><dd className="whitespace-pre-wrap break-words">{asset.descripcion}</dd></div>
    </dl>
  </section>;
}
