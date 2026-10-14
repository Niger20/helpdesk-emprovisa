import { describe, expect, it } from 'vitest';
import { calcularFechasLimiteSla, contarMinutosSla, sumarMinutosSla } from '../domain/sla-calculator.js';
import { calendario, fecha, pausa, prioridad } from './sla-fixtures.js';

describe('Configuración inválida y precisión del SLA', () => {
  it.each([-1, NaN, Infinity, Number.MAX_SAFE_INTEGER])('rechaza minutos %s', (minutos) => {
    expect(() => sumarMinutosSla(fecha('2026-10-12T08:00:00'), minutos, { modoCalendario: 'CONTINUO', calendario })).toThrow(RangeError);
  });
  it('rechaza fechas inválidas y evaluación anterior al inicio', () => {
    expect(() => sumarMinutosSla(new Date('invalida'), 10, { modoCalendario: 'CONTINUO', calendario })).toThrow(RangeError);
    expect(() => contarMinutosSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T07:00:00'), { modoCalendario: 'CONTINUO', calendario })).toThrow(RangeError);
  });
  it('rechaza un modo de calendario desconocido', () => {
    expect(() => sumarMinutosSla(fecha('2026-10-12T08:00:00'), 10, { modoCalendario: 'OTRO', calendario })).toThrow(RangeError);
  });
  it.each([
    { ...calendario, zonaHoraria: 'Zona/Inexistente' },
    { ...calendario, horarios: [] },
    { ...calendario, feriados: ['2026-02-30'] },
    { ...calendario, feriados: ['12/10/2026'] },
    { ...calendario, horarios: [{ diaSemana: 0, horaInicio: '08:00', horaFin: '17:00' }] },
    { ...calendario, horarios: [{ diaSemana: 1, horaInicio: '17:00', horaFin: '08:00' }] },
    { ...calendario, horarios: [{ diaSemana: 1, horaInicio: '08:00', horaFin: '08:00' }] },
    { ...calendario, horarios: [{ diaSemana: 1, horaInicio: '08:90', horaFin: '17:00' }] },
    { ...calendario, horarios: [{ diaSemana: 1, horaInicio: '08:00', horaFin: '24:01' }] },
    { ...calendario, horarios: [{ diaSemana: 6, horaInicio: '08:00', horaFin: '17:00' }] },
  ])('rechaza un calendario laboral sin configuración utilizable (%#)', (config) => {
    expect(() => sumarMinutosSla(fecha('2026-10-12T08:00:00'), 10, { modoCalendario: 'LABORAL', calendario: config })).toThrow(RangeError);
  });
  it('rechaza intervalos laborales superpuestos', () => {
    const horarios = [{ diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' }, { diaSemana: 1, horaInicio: '11:00', horaFin: '17:00' }];
    expect(() => sumarMinutosSla(fecha('2026-10-12T08:00:00'), 10, { modoCalendario: 'LABORAL', calendario: { ...calendario, horarios } })).toThrow('superponerse');
  });
  it.each([
    { ...prioridad('P1'), minutosRespuesta: 0 }, { ...prioridad('P1'), minutosSolucion: 1 },
    { ...prioridad('P1'), porcentajeAlerta: 0 }, { ...prioridad('P1'), porcentajeAlerta: 100 },
  ])('rechaza plazos o alertas inválidos (%#)', (config) => {
    expect(() => calcularFechasLimiteSla(fecha('2026-10-12T08:00:00'), config, calendario)).toThrow(RangeError);
  });
  it.each([
    { ...pausa('2026-10-12T08:00:00', null), motivo: 'OTRO' },
    { ...pausa('2026-10-12T08:00:00', null), detalle: '  ' },
    pausa('2026-10-12T08:10:00', '2026-10-12T08:00:00'),
  ])('rechaza pausas sin motivo, sin detalle o invertidas (%#)', (config) => {
    expect(() => sumarMinutosSla(fecha('2026-10-12T08:00:00'), 10, { modoCalendario: 'CONTINUO', calendario, pausas: [config] })).toThrow(RangeError);
  });
  it('acepta 24:00 como fin del día y conserva segundos y milisegundos', () => {
    const config = { ...calendario, horarios: [{ diaSemana: 1, horaInicio: '08:00', horaFin: '24:00' }] };
    expect(sumarMinutosSla(fecha('2026-10-12T23:30:00'), 30, { modoCalendario: 'LABORAL', calendario: config }))
      .toEqual(fecha('2026-10-13T00:00:00'));
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:10.125'), 1, { modoCalendario: 'LABORAL', calendario }))
      .toEqual(fecha('2026-10-12T08:01:10.125'));
  });
  it('los porcentajes configurables no fallan por redondeo binario', () => {
    const config = { ...prioridad('P3'), porcentajeAlerta: 33 };
    expect(calcularFechasLimiteSla(fecha('2026-10-12T08:00:00'), config, calendario).fechaAlertaSolucion)
      .toEqual(fecha('2026-10-12T10:38:24'));
  });
});
