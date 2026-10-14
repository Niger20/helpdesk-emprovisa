import { DateTime } from 'luxon';
import type { ReportsQuery } from '@helpdesk/contracts';

export function reportDateRange(query: ReportsQuery) {
  return { desde: DateTime.fromISO(query.desde, { zone: 'America/Managua' }).startOf('day').toJSDate(),
    hasta: DateTime.fromISO(query.hasta, { zone: 'America/Managua' }).plus({ days: 1 }).startOf('day').toJSDate() };
}
export const reportCivilDate = (date: Date) => DateTime.fromJSDate(date, { zone: 'America/Managua' }).toFormat('yyyy-MM-dd');
