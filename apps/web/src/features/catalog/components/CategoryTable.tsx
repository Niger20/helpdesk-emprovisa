import { useTable } from '@tanstack/react-table';
import type { Category } from '@helpdesk/contracts';
import { categoryColumns, categoryTableFeatures } from './columns';

export function CategoryTable({ data, select }: { data: Category[]; select: (category: Category) => void }) {
  const table = useTable({ features: categoryTableFeatures, columns: categoryColumns(select), data });
  return <div role="region" tabIndex={0} aria-label="Categorías de soporte" className="overflow-x-auto rounded border border-border bg-card">
    <table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Categorías de soporte</caption>
      <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} scope="col" className="p-3"><table.FlexRender header={header} /></th>)}</tr>)}</thead>
      <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-border">{row.getAllCells().map((cell) => <td key={cell.id} className="p-3"><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody>
    </table>
  </div>;
}
