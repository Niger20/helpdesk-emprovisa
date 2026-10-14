import { DateTime, IANAZone } from 'luxon';
import type { CalendarioLaboral, IntervaloSla } from './sla-types.js';

interface HorarioNormalizado { readonly diaSemana: number; readonly inicio: number; readonly fin: number }
export interface CalendarioNormalizado {
  readonly zonaHoraria: string;
  readonly horarios: readonly HorarioNormalizado[];
  readonly feriados: ReadonlySet<string>;
}

export function timestamp(fecha: Date): number {
  const value = fecha.getTime();
  if (!Number.isFinite(value)) throw new RangeError('La fecha del SLA no es válida.');
  return value;
}

function horaMilisegundos(hora: string): number {
  const parts = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(hora);
  if (!parts) throw new RangeError('El horario debe usar HH:mm o HH:mm:ss.');
  const hours = Number(parts[1]);
  const minutes = Number(parts[2]);
  const seconds = Number(parts[3] ?? 0);
  const fraction = Number((parts[4] ?? '').padEnd(3, '0'));
  if (hours > 24 || minutes > 59 || seconds > 59 || (hours === 24 && (minutes || seconds || fraction))) {
    throw new RangeError('La hora laboral no es válida.');
  }
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + fraction;
}

export function prepararCalendario(calendario: CalendarioLaboral): CalendarioNormalizado {
  if (!IANAZone.isValidZone(calendario.zonaHoraria)) throw new RangeError('La zona horaria no es válida.');
  const horarios = calendario.horarios.map((horario) => {
    const inicio = horaMilisegundos(horario.horaInicio);
    const fin = horaMilisegundos(horario.horaFin);
    if (!Number.isInteger(horario.diaSemana) || horario.diaSemana < 1 || horario.diaSemana > 7 || fin <= inicio) {
      throw new RangeError('El horario laboral debe tener un día válido y terminar después de iniciar.');
    }
    return { diaSemana: horario.diaSemana, inicio, fin };
  }).sort((a, b) => a.diaSemana - b.diaSemana || a.inicio - b.inicio);
  for (const [index, horario] of horarios.entries()) {
    const previo = horarios[index - 1];
    if (previo?.diaSemana === horario.diaSemana && horario.inicio < previo.fin) {
      throw new RangeError('Los horarios laborales no pueden superponerse.');
    }
  }
  if (!horarios.some((horario) => horario.diaSemana <= 5)) throw new RangeError('El calendario no tiene horas hábiles.');
  for (const feriado of calendario.feriados) {
    const fecha = DateTime.fromISO(feriado, { zone: calendario.zonaHoraria });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(feriado) || !fecha.isValid || fecha.toISODate() !== feriado) {
      throw new RangeError('Los feriados deben ser fechas válidas en formato aaaa-mm-dd.');
    }
  }
  return { zonaHoraria: calendario.zonaHoraria, horarios, feriados: new Set(calendario.feriados) };
}

export function esDiaHabil(dia: DateTime, calendario: CalendarioNormalizado): boolean {
  return dia.weekday <= 5 && !calendario.feriados.has(dia.toISODate() ?? '')
    && calendario.horarios.some((horario) => horario.diaSemana === dia.weekday);
}

function instanteDelDia(dia: DateTime, milisegundos: number): number {
  if (milisegundos === 86_400_000) return dia.plus({ days: 1 }).toMillis();
  return dia.set({ hour: Math.floor(milisegundos / 3_600_000), minute: Math.floor(milisegundos / 60_000) % 60,
    second: Math.floor(milisegundos / 1000) % 60, millisecond: milisegundos % 1000 }).toMillis();
}

export function* ventanasLaborales(inicio: number, fin: number, calendario: CalendarioNormalizado): Generator<IntervaloSla> {
  let dia = DateTime.fromMillis(inicio, { zone: calendario.zonaHoraria }).startOf('day');
  while (dia.toMillis() < fin) {
    if (!dia.isValid) throw new RangeError('El plazo excede el rango de fechas.');
    if (esDiaHabil(dia, calendario)) for (const horario of calendario.horarios) {
      if (horario.diaSemana !== dia.weekday) continue;
      const desde = Math.max(inicio, instanteDelDia(dia, horario.inicio));
      const hasta = Math.min(fin, instanteDelDia(dia, horario.fin));
      if (hasta > desde) yield { inicio: desde, fin: hasta };
    }
    dia = dia.plus({ days: 1 });
  }
}
