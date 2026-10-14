import type { z } from 'zod';
import type { ticketListSchema } from '@helpdesk/contracts';
import { TicketTable } from './TicketTable';

export function TicketQueue({ result, onPage }: { result: z.infer<typeof ticketListSchema>; onPage: (page: string) => void }) {
  return <><TicketTable data={result.data} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
    <p>{result.meta.total} tickets · Página {result.meta.page}</p><div className="flex gap-3">
      <button type="button" className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={result.meta.page === 1} onClick={() => onPage(String(result.meta.page - 1))}>Anterior</button>
      <button type="button" className="min-h-10 rounded border border-input px-3 disabled:opacity-50" disabled={result.meta.page * result.meta.pageSize >= result.meta.total} onClick={() => onPage(String(result.meta.page + 1))}>Siguiente</button>
    </div></div></>;
}
