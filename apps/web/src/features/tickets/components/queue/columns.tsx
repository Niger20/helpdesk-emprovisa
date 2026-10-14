import { Link } from 'react-router';
import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import type { Ticket } from '@helpdesk/contracts';
import { slaLabel } from '../../lib/slaLabel';
import { formatDate } from '../../../../lib/format';

export const ticketTableFeatures = tableFeatures({});
const helper = createColumnHelper<typeof ticketTableFeatures, Ticket>();
export const ticketColumns = helper.columns([
  helper.accessor('numero', { header: 'Ticket', cell: (cell) => <Link className="inline-flex min-h-10 items-center font-semibold text-primary underline" to={`/tickets/${cell.row.original.numero}`}>{cell.getValue()}</Link> }),
  helper.accessor('titulo', { header: 'Requerimiento' }),
  helper.accessor('estado', { header: 'Estado', cell: (cell) => cell.getValue().replaceAll('_', ' ') }),
  helper.accessor('prioridad', { header: 'Prioridad' }),
  helper.display({ id: 'sla', header: 'SLA', cell: (cell) => slaLabel(cell.row.original) }),
  helper.accessor('sede', { header: 'Sede' }),
  helper.accessor('fechaCreacion', { header: 'Creación', cell: (cell) => formatDate(cell.getValue()) }),
]);
