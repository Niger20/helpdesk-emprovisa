import { calendarInputSchema, calendarSchema } from '@helpdesk/contracts';
import { AppError } from '../../../common/errors/app-error.js';
import type { CalendarsRepository } from './calendars.repository.js';

export async function mapCalendar(repo: Pick<CalendarsRepository, 'find' | 'hours' | 'holidays' | 'sites'>, id: number, lock = false) {
  const row = await repo.find(id, lock);
  if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el calendario.');
  const data = calendarInputSchema.parse({ nombre: row.nombre, zonaHoraria: row.zonaHoraria,
    horarios: (await repo.hours(id)).map((hour) => ({ ...hour, horaInicio: hour.horaInicio.slice(0, 5), horaFin: hour.horaFin.slice(0, 5) })), feriados: await repo.holidays(id) });
  return calendarSchema.parse({ ...data, idCalendario: id, sedes: (await repo.sites(id)).map(({ idSede, nombre }) => ({ idSede, nombre })) });
}
