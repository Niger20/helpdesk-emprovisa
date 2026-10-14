import { describe, expect, it } from 'vitest';
import { calcularLimiteReapertura, iniciarCicloReapertura, puedeReabrirTicket } from '../domain/sla-reopening.js';
import { calendario, fecha, prioridad } from './sla-fixtures.js';

describe('Ventana de reapertura y nuevo ciclo', () => {
  it('el quinto día hábil conserva la hora local de cierre', () => {
    expect(calcularLimiteReapertura(fecha('2026-10-09T10:30:00'), calendario)).toEqual(fecha('2026-10-16T10:30:00'));
  });
  it('el día de cierre no cuenta y se saltan feriados y fines de semana', () => {
    expect(calcularLimiteReapertura(fecha('2026-10-09T10:30:00'), { ...calendario, feriados: ['2026-10-12'] }))
      .toEqual(fecha('2026-10-19T10:30:00'));
  });
  it('si cierra el fin de semana comienza a contar el lunes', () => {
    expect(calcularLimiteReapertura(fecha('2026-10-10T14:00:00'), calendario)).toEqual(fecha('2026-10-16T14:00:00'));
  });
  it('cuenta únicamente días con un horario laboral configurado', () => {
    const config = { ...calendario, horarios: calendario.horarios.filter((horario) => horario.diaSemana <= 4) };
    expect(calcularLimiteReapertura(fecha('2026-10-08T10:00:00'), config)).toEqual(fecha('2026-10-19T10:00:00'));
  });
  it('admite el instante exacto del límite y rechaza el milisegundo siguiente', () => {
    const cierre = fecha('2026-10-09T10:30:00');
    expect(puedeReabrirTicket(cierre, fecha('2026-10-16T10:30:00'), calendario)).toBe(true);
    expect(puedeReabrirTicket(cierre, fecha('2026-10-16T10:30:00.001'), calendario)).toBe(false);
    expect(puedeReabrirTicket(cierre, fecha('2026-10-09T10:29:59'), calendario)).toBe(false);
  });
  it('reinicia los plazos, pausas y marcas del ciclo sin modificar la creación original', () => {
    const cierre = fecha('2026-10-09T10:30:00');
    const reapertura = fecha('2026-10-12T08:00:00');
    const result = iniciarCicloReapertura(cierre, reapertura, 0, prioridad('P1'), calendario);
    expect(result.numeroReaperturas).toBe(1); expect(result.cicloSla).toBe(2);
    expect(result.minutosPausa).toBe(0); expect(result.inicioCiclo).toEqual(reapertura);
    expect(result.inicioCiclo).not.toBe(reapertura);
    expect(result.fechaPrimeraRespuesta).toBeNull(); expect(result.fechaResolucion).toBeNull();
    expect(result.fechaCierre).toBeNull(); expect(result.slaRespuestaCumplido).toBeNull(); expect(result.slaSolucionCumplido).toBeNull();
    expect(result.fechaLimiteRespuesta).toEqual(fecha('2026-10-12T08:15:00'));
    expect(result.fechaLimiteSolucion).toEqual(fecha('2026-10-12T10:00:00'));
    expect(result).not.toHaveProperty('fechaCreacion');
  });
  it('la reapertura laboral usa un nuevo calendario desde el instante de reapertura', () => {
    const result = iniciarCicloReapertura(fecha('2026-10-09T10:30:00'), fecha('2026-10-12T17:00:00'), 1, prioridad('P3'), calendario);
    expect(result.numeroReaperturas).toBe(2); expect(result.cicloSla).toBe(3);
    expect(result.fechaLimiteRespuesta).toEqual(fecha('2026-10-13T10:00:00'));
    expect(result.fechaLimiteSolucion).toEqual(fecha('2026-10-13T16:00:00'));
  });
  it('fuera de plazo exige un ticket nuevo referenciado', () => {
    expect(() => iniciarCicloReapertura(fecha('2026-10-09T10:30:00'), fecha('2026-10-19T08:00:00'), 0, prioridad('P1'), calendario))
      .toThrow('ticket nuevo');
  });
  it.each([-1, 0.5, NaN, Infinity])('rechaza el número de reaperturas %s', (numero) => {
    expect(() => iniciarCicloReapertura(fecha('2026-10-09T10:30:00'), fecha('2026-10-12T08:00:00'), numero, prioridad('P1'), calendario)).toThrow(RangeError);
  });
});
