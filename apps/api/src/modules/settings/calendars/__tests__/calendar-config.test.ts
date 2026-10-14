import { describe, expect, it } from 'vitest';
import { calendarInputSchema } from '@helpdesk/contracts';
import { normalizeCalendar, sameCalendar } from '../domain/calendar-config.js';

const input = { nombre: 'Horario laboral', zonaHoraria: 'America/Managua' as const,
  horarios: [{ diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' }, { diaSemana: 1, horaInicio: '13:00', horaFin: '17:00' }], feriados: [] };
describe('Configuración de calendario', () => {
  it('admite intervalos partidos y contiguos', () => {
    expect(calendarInputSchema.safeParse(input).success).toBe(true);
    expect(calendarInputSchema.safeParse({ ...input, horarios: [{ ...input.horarios[0], horaFin: '13:00' }, input.horarios[1]] }).success).toBe(true);
  });
  it('rechaza horas invertidas, iguales, fuera del día y superpuestas', () => {
    for (const horarios of [[{ diaSemana: 1, horaInicio: '17:00', horaFin: '08:00' }], [{ diaSemana: 1, horaInicio: '08:00', horaFin: '08:00' }],
      [{ diaSemana: 1, horaInicio: '08:00', horaFin: '24:00' }], [input.horarios[0], { diaSemana: 1, horaInicio: '11:00', horaFin: '17:00' }]]) {
      expect(calendarInputSchema.safeParse({ ...input, horarios }).success).toBe(false);
    }
  });
  it('rechaza calendario vacío, fin de semana y otra zona', () => {
    expect(calendarInputSchema.safeParse({ ...input, horarios: [] }).success).toBe(false);
    expect(calendarInputSchema.safeParse({ ...input, horarios: [{ diaSemana: 6, horaInicio: '08:00', horaFin: '17:00' }] }).success).toBe(false);
    expect(calendarInputSchema.safeParse({ ...input, zonaHoraria: 'UTC' }).success).toBe(false);
  });
  it('valida fecha civil real, descripción y unicidad de feriados', () => {
    for (const feriados of [[{ fecha: '2026-02-30', descripcion: 'Inválido' }], [{ fecha: '2026-10-14', descripcion: '' }],
      [{ fecha: '2026-10-14', descripcion: 'Primero' }, { fecha: '2026-10-14', descripcion: 'Duplicado' }]]) {
      expect(calendarInputSchema.safeParse({ ...input, feriados }).success).toBe(false);
    }
  });
  it('normaliza orden sin mutar el original y compara todos los campos', () => {
    const reversed = { ...input, horarios: [...input.horarios].reverse() };
    expect(sameCalendar(input, reversed)).toBe(true); normalizeCalendar(reversed);
    expect(reversed.horarios[0]?.horaInicio).toBe('13:00');
    expect(sameCalendar(input, { ...input, nombre: 'Otro' })).toBe(false);
  });
});
