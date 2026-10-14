import { z } from 'zod';

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Usá hora de 00:00 a 23:59.');
export const workHoursSchema = z.object({ diaSemana: z.number().int().min(1).max(7), horaInicio: timeSchema, horaFin: timeSchema })
  .refine((value) => value.horaFin > value.horaInicio, 'La hora final debe ser posterior a la inicial.');
export const calendarSnapshotSchema = z.object({ zonaHoraria: z.string().min(1).max(40),
  horarios: z.array(workHoursSchema).min(1).max(35), feriados: z.array(z.iso.date()).max(1000) });
export const calendarInputSchema = z.strictObject({ nombre: z.string().trim().min(1).max(60), zonaHoraria: z.literal('America/Managua'),
  horarios: z.array(workHoursSchema).min(1).max(35), feriados: z.array(z.object({ fecha: z.iso.date(), descripcion: z.string().trim().min(1).max(100) })).max(1000) })
  .superRefine((value, context) => {
    const hours = [...value.horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
    hours.forEach((hour, index) => {
      if (hour.diaSemana > 5) context.addIssue({ code: 'custom', message: 'Los fines de semana no cuentan como días laborales.', path: ['horarios'] });
      const previous = hours[index - 1];
      if (previous?.diaSemana === hour.diaSemana && previous.horaFin > hour.horaInicio) context.addIssue({ code: 'custom', message: 'Los intervalos de un día no pueden superponerse.', path: ['horarios'] });
    });
    if (new Set(value.feriados.map((day) => day.fecha)).size !== value.feriados.length) context.addIssue({ code: 'custom', message: 'No repitas fechas de feriados.', path: ['feriados'] });
  });
export const calendarSchema = calendarInputSchema.safeExtend({ idCalendario: z.number().int().positive(),
  sedes: z.array(z.object({ idSede: z.number().int(), nombre: z.string() })) });
export const calendarUpdateSchema = calendarInputSchema.safeExtend({ anterior: calendarInputSchema });
export const calendarParamsSchema = z.object({ idCalendario: z.coerce.number().int().positive() });
export const calendarQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) });
export const calendarListSchema = z.object({ data: z.array(calendarSchema), meta: z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }) });
export const calendarSitesSchema = z.array(z.object({ idSede: z.number().int(), nombre: z.string(), idCalendario: z.number().int() }));
export const calendarBindingSchema = z.strictObject({ idCalendarioAnterior: z.number().int().positive() });
export const calendarBindingParamsSchema = calendarParamsSchema.extend({ idSede: z.coerce.number().int().positive() });
export type CalendarInput = z.infer<typeof calendarInputSchema>;
export type Calendar = z.infer<typeof calendarSchema>;
export type CalendarUpdate = z.infer<typeof calendarUpdateSchema>;
export type CalendarSnapshot = z.infer<typeof calendarSnapshotSchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
