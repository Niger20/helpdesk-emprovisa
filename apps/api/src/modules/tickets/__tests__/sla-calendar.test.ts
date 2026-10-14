import { describe, expect, it } from 'vitest';
import { sumarMinutosSla, contarMinutosSla, calcularFechasLimiteSla } from '../domain/sla-calculator.js';
import { calendario, fecha, prioridad } from './sla-fixtures.js';

describe('Calendario y plazos SLA', () => {
  it.each([
    ['P1', '2026-10-12T08:15:00', '2026-10-12T10:00:00'],
    ['P2', '2026-10-12T08:30:00', '2026-10-12T12:00:00'],
    ['P3', '2026-10-12T10:00:00', '2026-10-12T16:00:00'],
    ['P4', '2026-10-12T12:00:00', '2026-10-14T14:00:00'],
  ])('%s usa los plazos recibidos de la prioridad', (codigo, respuesta, solucion) => {
    const result = calcularFechasLimiteSla(fecha('2026-10-12T08:00:00'), prioridad(codigo), calendario);
    expect(result.fechaLimiteRespuesta).toEqual(fecha(respuesta));
    expect(result.fechaLimiteSolucion).toEqual(fecha(solucion));
  });
  it('P1 y P2 cuentan fines de semana, feriados y noches', () => {
    const config = { ...calendario, feriados: ['2026-10-12'] };
    const result = calcularFechasLimiteSla(fecha('2026-10-11T23:30:00'), prioridad('P2'), config);
    expect(result.fechaLimiteRespuesta).toEqual(fecha('2026-10-12T00:00:00'));
    expect(result.fechaLimiteSolucion).toEqual(fecha('2026-10-12T03:30:00'));
  });
  it.each([
    ['2026-10-12T07:00:00', 60, '2026-10-12T09:00:00'],
    ['2026-10-12T08:00:00', 60, '2026-10-12T09:00:00'],
    ['2026-10-12T16:00:00', 60, '2026-10-12T17:00:00'],
    ['2026-10-12T17:00:00', 60, '2026-10-13T09:00:00'],
    ['2026-10-12T18:00:00', 60, '2026-10-13T09:00:00'],
    ['2026-10-16T16:30:00', 60, '2026-10-19T08:30:00'],
    ['2026-10-17T10:00:00', 60, '2026-10-19T09:00:00'],
    ['2026-10-18T10:00:00', 60, '2026-10-19T09:00:00'],
    ['2026-01-30T16:30:00', 60, '2026-02-02T08:30:00'],
  ])('desde %s suma %s minutos hábiles', (inicio, minutos, esperado) => {
    expect(sumarMinutosSla(fecha(inicio), minutos, { modoCalendario: 'LABORAL', calendario })).toEqual(fecha(esperado));
  });
  it('salta feriados consecutivos y el cambio de año', () => {
    const config = { ...calendario, feriados: ['2026-10-19', '2026-10-20', '2027-01-01'] };
    expect(sumarMinutosSla(fecha('2026-10-16T16:30:00'), 60, { modoCalendario: 'LABORAL', calendario: config }))
      .toEqual(fecha('2026-10-21T08:30:00'));
    expect(sumarMinutosSla(fecha('2026-12-31T16:30:00'), 60, { modoCalendario: 'LABORAL', calendario: config }))
      .toEqual(fecha('2027-01-04T08:30:00'));
  });
  it('respeta intervalos separados y el descanso de mediodía', () => {
    const config = { ...calendario, horarios: [1, 2, 3, 4, 5].flatMap((diaSemana) => [
      { diaSemana, horaInicio: '08:00', horaFin: '12:00' }, { diaSemana, horaInicio: '13:00', horaFin: '17:00' },
    ]) };
    expect(sumarMinutosSla(fecha('2026-10-12T11:30:00'), 60, { modoCalendario: 'LABORAL', calendario: config }))
      .toEqual(fecha('2026-10-12T13:30:00'));
    expect(contarMinutosSla(fecha('2026-10-12T11:30:00'), fecha('2026-10-12T13:30:00'), { modoCalendario: 'LABORAL', calendario: config })).toBe(60);
  });
  it('usa la zona del calendario aunque los instantes lleguen en UTC', () => {
    expect(sumarMinutosSla(new Date('2026-10-12T13:00:00Z'), 60, { modoCalendario: 'LABORAL', calendario }))
      .toEqual(new Date('2026-10-12T15:00:00Z'));
  });
  it('ignora horarios de sábado y domingo', () => {
    const config = { ...calendario, horarios: [...calendario.horarios, { diaSemana: 6, horaInicio: '08:00', horaFin: '17:00' }] };
    expect(sumarMinutosSla(fecha('2026-10-17T10:00:00'), 60, { modoCalendario: 'LABORAL', calendario: config }))
      .toEqual(fecha('2026-10-19T09:00:00'));
  });
  it('devuelve una copia del inicio para cero minutos', () => {
    const inicio = fecha('2026-10-12T07:00:00');
    const result = sumarMinutosSla(inicio, 0, { modoCalendario: 'LABORAL', calendario });
    expect(result).toEqual(inicio); expect(result).not.toBe(inicio);
  });
  it('alcanza el umbral 50% con precisión de segundos', () => {
    const result = calcularFechasLimiteSla(fecha('2026-10-12T08:00:00'), prioridad('P1'), calendario);
    expect(result.fechaAlertaRespuesta).toEqual(fecha('2026-10-12T08:07:30'));
    expect(result.fechaAlertaSolucion).toEqual(fecha('2026-10-12T09:00:00'));
  });
  it('no cuenta una medianoche UTC como cambio de día en Managua', () => {
    expect(contarMinutosSla(new Date('2026-10-12T23:00:00Z'), new Date('2026-10-13T01:00:00Z'),
      { modoCalendario: 'LABORAL', calendario })).toBe(0);
  });
});
