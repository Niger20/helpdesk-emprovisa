import { describe, expect, it } from 'vitest';
import { evaluarCumplimientoSla } from '../domain/sla-compliance.js';
import { calendario, fecha, pausa, prioridad } from './sla-fixtures.js';

describe('Cumplimiento evaluado en la resolución', () => {
  it('cumple cuando responde y resuelve exactamente en el límite', () => {
    expect(evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T08:15:00'), fecha('2026-10-12T10:00:00'), prioridad('P1'), calendario))
      .toEqual({ minutosRespuesta: 15, minutosSolucion: 120, slaRespuestaCumplido: true, slaSolucionCumplido: true });
  });
  it('un milisegundo sobre el plazo implica incumplimiento', () => {
    const result = evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T08:15:00.001'), fecha('2026-10-12T10:00:00.001'), prioridad('P1'), calendario);
    expect(result.slaRespuestaCumplido).toBe(false); expect(result.slaSolucionCumplido).toBe(false);
  });
  it('evalúa respuesta y solución de manera independiente', () => {
    const result = evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T08:20:00'), fecha('2026-10-12T09:00:00'), prioridad('P1'), calendario);
    expect(result.slaRespuestaCumplido).toBe(false); expect(result.slaSolucionCumplido).toBe(true);
  });
  it('sin primera respuesta no declara cumplimiento de respuesta', () => {
    const result = evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), null, fecha('2026-10-12T09:00:00'), prioridad('P1'), calendario);
    expect(result.minutosRespuesta).toBeNull(); expect(result.slaRespuestaCumplido).toBe(false);
    expect(result.slaSolucionCumplido).toBe(true);
  });
  it('descuenta pausas laborales al resolver un caso que atraviesa el fin de semana', () => {
    const result = evaluarCumplimientoSla(fecha('2026-10-16T16:00:00'), fecha('2026-10-16T16:30:00'), fecha('2026-10-19T16:00:00'),
      prioridad('P3'), calendario, [pausa('2026-10-16T16:30:00', '2026-10-19T08:30:00')]);
    expect(result.minutosSolucion).toBe(480); expect(result.slaSolucionCumplido).toBe(true);
    expect(result.minutosRespuesta).toBe(30);
  });
  it('rechaza resolución anterior al inicio y respuesta posterior a la resolución', () => {
    expect(() => evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), null, fecha('2026-10-12T07:59:00'), prioridad('P1'), calendario)).toThrow(RangeError);
    expect(() => evaluarCumplimientoSla(fecha('2026-10-12T08:00:00'), fecha('2026-10-12T10:01:00'), fecha('2026-10-12T10:00:00'), prioridad('P1'), calendario)).toThrow(RangeError);
  });
});
