import type { ReportsQuery } from '@helpdesk/contracts';
export const reportsKeys = { catalog: ['reportes', 'catalogos'] as const, dashboard: (query: ReportsQuery) => ['reportes', 'tablero', query] as const };
