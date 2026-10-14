import type { AssetDetail } from '@helpdesk/contracts';
import { assetDate } from '../../lib/format';

export function AssetCustodyHistory({ history }: { history: AssetDetail['custodiaHistorial'] }) {
  return <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="historial-custodia">
    <h2 id="historial-custodia" className="mb-4 text-lg font-semibold">Historial de custodia</h2>
    {history.length === 0 ? <p className="text-sm text-muted">El activo todavía no tiene custodias registradas.</p> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Custodias del activo</caption>
        <thead><tr>{['Custodio', 'Desde', 'Hasta', 'Acta', 'Registrado por'].map((label) => <th scope="col" key={label} className="border-b border-border p-3 text-muted">{label}</th>)}</tr></thead>
        <tbody>{history.map((item) => <tr key={item.idCustodia} className="border-b border-border">
          <td className="p-3">{item.custodio}</td><td className="p-3">{assetDate(item.desde)}</td><td className="p-3">{item.hasta ? assetDate(item.hasta) : 'Vigente'}</td>
          <td className="p-3">{item.actaNumero}</td><td className="p-3">{item.registradoPor}</td>
        </tr>)}</tbody>
      </table></div>}
  </section>;
}
