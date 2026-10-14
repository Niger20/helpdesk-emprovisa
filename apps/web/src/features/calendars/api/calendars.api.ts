import { calendarInputSchema, calendarListSchema, calendarSchema, calendarSitesSchema } from '@helpdesk/contracts';
import type { Calendar, CalendarInput } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

const root = '/api/v1/admin/calendarios';
export const fetchCalendars = (page: number, signal: AbortSignal) => http(`${root}?page=${page}`, calendarListSchema, { signal });
export const fetchCalendarSites = (signal: AbortSignal) => http(`${root}/sedes`, calendarSitesSchema, { signal });
const options = (data: unknown, csrf: string, method = 'PUT') => ({ method, headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify(data) });
export const saveCalendar = (previous: Calendar | null, data: CalendarInput, csrf: string) => http(previous ? `${root}/${previous.idCalendario}` : root, calendarSchema,
  options(previous ? { ...data, anterior: calendarInputSchema.strip().parse(previous) } : data, csrf, previous ? 'PUT' : 'POST'));
export const bindCalendar = (id: number, site: { idSede: number; idCalendario: number }, csrf: string) => http(`${root}/${id}/sedes/${site.idSede}`, calendarSchema, options({ idCalendarioAnterior: site.idCalendario }, csrf));
