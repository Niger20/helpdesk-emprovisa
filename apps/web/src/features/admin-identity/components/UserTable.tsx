import { useTable } from '@tanstack/react-table';
import type { AdminUser } from '@helpdesk/contracts';
import { identityTableFeatures, userColumns } from './columns';

export function UserTable({ data, select }: { data: AdminUser[]; select: (user: AdminUser) => void }) {
  const table = useTable({ features: identityTableFeatures, columns: userColumns(select), data });
  return <div role="region" tabIndex={0} aria-label="Usuarios locales" className="overflow-x-auto rounded border border-border bg-card">
    <table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Usuarios locales dentro de tu alcance</caption>
      <thead>{table.getHeaderGroups().map((g) => <tr key={g.id}>{g.headers.map((h) => <th key={h.id} scope="col" className="p-3"><table.FlexRender header={h} /></th>)}</tr>)}</thead>
      <tbody>{table.getRowModel().rows.map((r) => <tr key={r.id} className="border-t border-border">{r.getAllCells().map((c) => <td key={c.id} className="p-3"><table.FlexRender cell={c} /></td>)}</tr>)}</tbody>
    </table>
  </div>;
}
