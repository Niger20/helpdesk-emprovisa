import { describe, expect, it } from 'vitest';
import { calcularFechasLimiteSla, contarMinutosSla, sumarMinutosSla } from '../domain/sla-calculator.js';
import { calendario, fecha, pausa, prioridad } from './sla-fixtures.js';

describe('Pausas del SLA', () => {
  it('descuenta una pausa cerrada y desplaza el vencimiento', () => {
    const pausas = [pausa('2026-10-12T08:10:00', '2026-10-12T08:20:00')];
    const reloj = { modoCalendario: 'CONTINUO', calendario, pausas };
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 15, reloj)).toEqual(fecha('2026-10-12T08:25:00'));
    expect(contarMinutosSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T08:25:00'), reloj)).toBe(15);
  });
  it('el descuento laboral solo incluye la intersección con horarios hábiles', () => {
    const reloj = { modoCalendario: 'LABORAL', calendario, pausas: [pausa('2026-10-16T16:30:00', '2026-10-19T08:30:00')] };
    expect(sumarMinutosSla(fecha('2026-10-16T16:00:00'), 60, reloj)).toEqual(fecha('2026-10-19T09:00:00'));
    expect(contarMinutosSla(fecha('2026-10-16T16:00:00'), fecha('2026-10-19T09:00:00'), reloj)).toBe(60);
  });
  it('una pausa completamente nocturna no desplaza el SLA laboral', () => {
    const reloj = { modoCalendario: 'LABORAL', calendario, pausas: [pausa('2026-10-12T18:00:00', '2026-10-13T07:00:00')] };
    expect(sumarMinutosSla(fecha('2026-10-12T16:00:00'), 120, reloj)).toEqual(fecha('2026-10-13T09:00:00'));
  });
  it('fusiona pausas duplicadas y superpuestas sin descontar dos veces', () => {
    const reloj = { modoCalendario: 'CONTINUO', calendario, pausas: [
      pausa('2026-10-12T08:20:00', '2026-10-12T08:40:00'),
      pausa('2026-10-12T08:10:00', '2026-10-12T08:30:00'),
      pausa('2026-10-12T08:10:00', '2026-10-12T08:30:00'),
    ] };
    expect(contarMinutosSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T09:00:00'), reloj)).toBe(30);
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 30, reloj)).toEqual(fecha('2026-10-12T09:00:00'));
  });
  it('una pausa posterior al vencimiento no lo extiende retroactivamente', () => {
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 15, {
      modoCalendario: 'CONTINUO', calendario, pausas: [pausa('2026-10-12T08:20:00', '2026-10-12T09:00:00')],
    })).toEqual(fecha('2026-10-12T08:15:00'));
  });
  it('recorta pausas que empiezan antes del ciclo o terminan después de la evaluación', () => {
    const reloj = { modoCalendario: 'CONTINUO', calendario, pausas: [pausa('2026-10-12T07:50:00', '2026-10-12T08:10:00'), pausa('2026-10-12T08:40:00', '2026-10-12T09:10:00')] };
    expect(contarMinutosSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T09:00:00'), reloj)).toBe(30);
  });
  it('con pausa abierta el reloj se congela y el vencimiento pendiente es indeterminado', () => {
    const reloj = { modoCalendario: 'CONTINUO', calendario, pausas: [pausa('2026-10-12T08:10:00', null)] };
    expect(contarMinutosSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-13T10:00:00'), reloj)).toBe(10);
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 15, reloj)).toBeNull();
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 10, reloj)).toEqual(fecha('2026-10-12T08:10:00'));
  });
  it('una pausa abierta fuera del horario no permite continuar el siguiente día', () => {
    expect(sumarMinutosSla(fecha('2026-10-16T16:00:00'), 120, {
      modoCalendario: 'LABORAL', calendario, pausas: [pausa('2026-10-17T10:00:00', null)],
    })).toBeNull();
  });
  it('reanudar restablece una fecha finita sin reiniciar el ciclo', () => {
    const inicio = fecha('2026-10-12T08:00:00');
    const pausas = [pausa('2026-10-12T08:10:00', '2026-10-12T09:10:00')];
    const result = calcularFechasLimiteSla(inicio, prioridad('P1'), calendario, pausas);
    expect(result.fechaLimiteRespuesta).toEqual(fecha('2026-10-12T09:15:00'));
    expect(result.fechaLimiteSolucion).toEqual(fecha('2026-10-12T11:00:00'));
  });
  it('admite proveedor externo y pausas de duración cero', () => {
    const proveedor = { ...pausa('2026-10-12T08:10:00', '2026-10-12T08:20:00'), motivo: 'PROVEEDOR_EXTERNO' };
    const cero = pausa('2026-10-12T08:05:00', '2026-10-12T08:05:00');
    expect(sumarMinutosSla(fecha('2026-10-12T08:00:00'), 15, { modoCalendario: 'CONTINUO', calendario, pausas: [proveedor, cero] }))
      .toEqual(fecha('2026-10-12T08:25:00'));
  });
  it('no altera los objetos de fecha, prioridad, horarios o pausas recibidos', () => {
    const inicio = fecha('2026-10-12T08:00:00');
    const pausas = [pausa('2026-10-12T08:10:00', '2026-10-12T08:20:00')];
    const data = { inicio, pausas, calendario, prioridad: prioridad('P1') };
    const snapshot = JSON.stringify(data);
    calcularFechasLimiteSla(inicio, data.prioridad, calendario, pausas);
    expect(JSON.stringify(data)).toBe(snapshot);
  });
});
