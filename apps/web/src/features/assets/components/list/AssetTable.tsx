import { flexRender, useTable } from '@tanstack/react-table';
import type { AssetList } from '@helpdesk/contracts';
import { assetColumns, assetTableFeatures } from './columns';

interface Props { data: AssetList; onPage: (page: number) => void }
export function AssetTable({ data, onPage }: Props) {
  const table = useTable({ features: assetTableFeatures, columns: assetColumns, data: data.data });
  const { page, pageSize, total } = data.meta;
  return <div className="rounded-lg border border-border bg-card">
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <caption className="sr-only">Inventario de activos de TI</caption>
      <thead className="bg-background text-muted">{table.getHeaderGroups().map((group) => <tr key={group.id}>
        {group.headers.map((header) => <th scope="col" key={header.id} className="whitespace-nowrap border-b border-border px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
      </tr>)}</thead>
      <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b border-border">
        {row.getAllCells().map((cell) => <td key={cell.id} className="px-4 py-2">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
      </tr>)}</tbody>
    </table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
      <span>{total} activos · Página {page} de {Math.max(1, Math.ceil(total / pageSize))}</span>
      <div className="flex gap-2"><button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={page === 1} onClick={() => onPage(page - 1)}>Anterior</button>
        <button className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Siguiente</button></div>
    </div>
  </div>;
}
