import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import type { Category } from '@helpdesk/contracts';

export const categoryTableFeatures = tableFeatures({});
const helper = createColumnHelper<typeof categoryTableFeatures, Category>();
export const categoryColumns = (select: (category: Category) => void) => helper.columns([
  helper.accessor('nombre', { header: 'Categoría', cell: (cell) => <button type="button" className="min-h-10 text-primary underline" onClick={() => select(cell.row.original)}>{cell.getValue()}</button> }),
  helper.accessor('padre', { header: 'Superior', cell: (cell) => cell.getValue() ?? 'Sin superior' }),
  helper.accessor('tipoAplicable', { header: 'Tipo', cell: (cell) => ({ INCIDENTE: 'Incidente', SOLICITUD: 'Solicitud', AMBOS: 'Ambos' })[cell.getValue()] }),
  helper.accessor('requiereActivo', { header: 'Activo requerido', cell: (cell) => cell.getValue() ? 'Sí' : 'No' }),
  helper.accessor('grupoDefault', { header: 'Grupo', cell: (cell) => cell.getValue() ?? 'Sin grupo' }),
  helper.accessor('activa', { header: 'Estado', cell: (cell) => cell.getValue() ? 'Activa' : 'Inactiva' }),
]);
