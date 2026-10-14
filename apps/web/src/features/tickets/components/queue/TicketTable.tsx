import { useTable } from '@tanstack/react-table';
import type { Ticket } from '@helpdesk/contracts';
import { ticketColumns, ticketTableFeatures } from './columns';

export function TicketTable({ data }: { data: Ticket[] }) {
  const table = useTable({ features: ticketTableFeatures, columns: ticketColumns, data });
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card" role="region" tabIndex={0} aria-label="Cola de tickets">
      <table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Tickets visibles para tu cuenta</caption>
        <thead className="bg-background">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} scope="col" className="p-3"><table.FlexRender header={header} /></th>)}</tr>)}</thead>
        <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-border">{row.getAllCells().map((cell) => <td key={cell.id} className="p-3"><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
