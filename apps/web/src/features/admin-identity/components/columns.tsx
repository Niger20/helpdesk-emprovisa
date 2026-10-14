import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import type { AdminUser } from '@helpdesk/contracts';

export const identityTableFeatures = tableFeatures({});
const helper = createColumnHelper<typeof identityTableFeatures, AdminUser>();
export const userColumns = (select: (user: AdminUser) => void) => helper.columns([
  helper.accessor('nombreCompleto', { header: 'Usuario', cell: (cell) => <button type="button" className="min-h-10 text-primary underline" onClick={() => select(cell.row.original)}>{cell.getValue()}</button> }),
  helper.accessor('username', { header: 'Cuenta local' }), helper.accessor('sedeNombre', { header: 'Sede' }),
  helper.accessor('estado', { header: 'Estado' }), helper.display({ id: 'bloqueo', header: 'Bloqueo', cell: (cell) => cell.row.original.bloqueadoHasta ? 'Bloqueo registrado' : 'Sin bloqueo' }),
]);
