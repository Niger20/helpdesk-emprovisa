import { calendarInputSchema } from '@helpdesk/contracts';
import type { CalendarInput } from '@helpdesk/contracts';

export function normalizeCalendar(input: CalendarInput): CalendarInput {
  const data = calendarInputSchema.parse(input);
  return { ...data, horarios: [...data.horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)),
    feriados: [...data.feriados].sort((a, b) => a.fecha.localeCompare(b.fecha)) };
}
export const sameCalendar = (left: CalendarInput, right: CalendarInput) => JSON.stringify(normalizeCalendar(left)) === JSON.stringify(normalizeCalendar(right));
