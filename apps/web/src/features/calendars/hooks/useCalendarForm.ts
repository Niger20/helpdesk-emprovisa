import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarInputSchema } from '@helpdesk/contracts';
import type { Calendar, CalendarInput } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { saveCalendar } from '../api/calendars.api';

export function useCalendarForm(selected: Calendar | null, saved: (calendar: Calendar) => void) {
  const session = useAuth(); const client = useQueryClient();
  const form = useForm<CalendarInput>({ resolver: zodResolver(calendarInputSchema), defaultValues: selected ? calendarInputSchema.strip().parse(selected)
    : { nombre: '', zonaHoraria: 'America/Managua', horarios: [1, 2, 3, 4, 5].map((diaSemana) => ({ diaSemana, horaInicio: '08:00', horaFin: '17:00' })), feriados: [] } });
  const hours = useFieldArray({ control: form.control, name: 'horarios' }); const holidays = useFieldArray({ control: form.control, name: 'feriados' });
  const mutation = useMutation({ mutationFn: (data: CalendarInput) => {
    if (!session.data) throw new Error('Iniciá sesión para continuar.'); return saveCalendar(selected, data, session.data.csrfToken);
  }, onSuccess: async (calendar) => { await client.invalidateQueries({ queryKey: ['calendarios'] }); saved(calendar); } });
  return { form, hours, holidays, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
export type CalendarFormState = ReturnType<typeof useCalendarForm>;
