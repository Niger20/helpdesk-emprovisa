import { calendarInputSchema, calendarQuerySchema, calendarUpdateSchema, calendarParamsSchema, calendarBindingSchema, calendarBindingParamsSchema, calendarSitesSchema } from '@helpdesk/contracts';
import type { CalendarInput, CalendarQuery, CalendarUpdate } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { AppError } from '../../../common/errors/app-error.js';
import { normalizeCalendar, sameCalendar } from './domain/calendar-config.js';
import { requireCalendarAdmin } from './calendars.policies.js';
import { mapCalendar } from './calendars.mapper.js';
import type { CalendarsRepository } from './calendars.repository.js';

export function buildCalendarsService(repository: CalendarsRepository) {
  const detail = async (context: SessionContext | null, id: number) => { requireCalendarAdmin(context); calendarParamsSchema.parse({ idCalendario: id }); return mapCalendar(repository, id); };
  const save = async (context: SessionContext | null, id: number | null, input: CalendarInput | CalendarUpdate, now = new Date()) => {
    requireCalendarAdmin(context); if (id !== null) calendarParamsSchema.parse({ idCalendario: id });
    const parsed = id === null ? calendarInputSchema.parse(input) : calendarUpdateSchema.parse(input);
    const data = normalizeCalendar(calendarInputSchema.strip().parse(parsed));
    const result = await repository.atomic(async (repo) => {
      const previous = id === null ? null : calendarInputSchema.strip().parse(await mapCalendar(repo, id, true));
      if (previous && !sameCalendar(previous, calendarUpdateSchema.parse(input).anterior)) throw new AppError('ENTRADA_INVALIDA', 409, 'Otra persona editó el calendario. Recargá antes de guardar.');
      if (id !== null && await repo.missing(id)) throw new AppError('ENTRADA_INVALIDA', 409, 'Hay tickets sin calendario de ciclo protegido. Aplicá la migración antes de editar.');
      const idCalendario = id ?? (await repo.insert(data)).idCalendario;
      await repo.replace(idCalendario, data);
      await repo.audit(context, idCalendario, id === null ? 'CALENDARIO_CREADO' : 'CALENDARIO_EDITADO', previous, data, now);
      return idCalendario;
    }); return detail(context, result);
  };
  return { detail, sites: async (context: SessionContext | null) => { requireCalendarAdmin(context); return calendarSitesSchema.parse(await repository.sites()); },
    list: async (context: SessionContext | null, input: CalendarQuery) => {
      requireCalendarAdmin(context); const query = calendarQuerySchema.parse(input); const result = await repository.list(query);
      return { data: await Promise.all(result.rows.map((row) => mapCalendar(repository, row.idCalendario))), meta: { ...query, total: result.total } };
    }, create: (context: SessionContext | null, input: CalendarInput) => save(context, null, input),
    edit: (context: SessionContext | null, id: number, input: CalendarUpdate) => save(context, id, input),
    bind: async (context: SessionContext | null, id: number, idSede: number, anterior: number, now = new Date()) => {
      requireCalendarAdmin(context); calendarBindingParamsSchema.parse({ idCalendario: id, idSede }); calendarBindingSchema.parse({ idCalendarioAnterior: anterior });
      await repository.atomic(async (repo) => {
        await mapCalendar(repo, id); const site = await repo.site(idSede);
        if (!site) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró la sede activa.');
        if (site.idCalendario !== anterior) throw new AppError('ENTRADA_INVALIDA', 409, 'Cambió el calendario de esta sede. Recargá antes de asignar.');
        if (await repo.missing(site.idCalendario)) throw new AppError('ENTRADA_INVALIDA', 409, 'Hay tickets sin calendario de ciclo protegido. Aplicá la migración primero.');
        await repo.bind(idSede, id); await repo.audit(context, idSede, 'CALENDARIO_SEDE', anterior, id, now);
      }); return detail(context, id);
    } };
}
export type CalendarsService = ReturnType<typeof buildCalendarsService>;
