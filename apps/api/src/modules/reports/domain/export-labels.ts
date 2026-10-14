import { DateTime } from 'luxon';
import type { ReportsCatalog } from '@helpdesk/contracts';
import type { ReportsQuery } from '@helpdesk/contracts';

export const reportGeneratedLabel = (value: string) => DateTime.fromISO(value).setZone('America/Managua').toFormat('dd/MM/yyyy HH:mm');
export function reportFilterLabels(filters: ReportsQuery, catalog: ReportsCatalog) {
  return { sede: filters.idSede ? catalog.sedes.find((site) => site.idSede === filters.idSede)?.nombre ?? 'Sede seleccionada sin datos' : 'Todas las autorizadas',
    categoria: filters.idCategoria ? catalog.categorias.find((category) => category.idCategoria === filters.idCategoria)?.nombre ?? 'Categoría seleccionada sin datos' : 'Todas' };
}
