import { DateTime } from 'luxon';
import { esDiaHabil, prepararCalendario, timestamp } from './sla-calendar.js';
import { calcularFechasLimiteSla } from './sla-calculator.js';
import type { CalendarioLaboral, PrioridadSla } from './sla-types.js';

export function calcularLimiteReapertura(fechaCierre: Date, calendario: CalendarioLaboral): Date {
  const configuracion = prepararCalendario(calendario);
  let fecha = DateTime.fromMillis(timestamp(fechaCierre), { zone: configuracion.zonaHoraria });
  let pendientes = 5;
  while (pendientes > 0) {
    fecha = fecha.plus({ days: 1 });
    if (!fecha.isValid) throw new RangeError('El plazo de reapertura excede el rango de fechas.');
    if (esDiaHabil(fecha, configuracion)) pendientes -= 1;
  }
  return fecha.toJSDate();
}

export function puedeReabrirTicket(fechaCierre: Date, fechaReapertura: Date, calendario: CalendarioLaboral): boolean {
  const reapertura = timestamp(fechaReapertura);
  return reapertura >= timestamp(fechaCierre) && reapertura <= calcularLimiteReapertura(fechaCierre, calendario).getTime();
}

export function iniciarCicloReapertura(fechaCierre: Date, fechaReapertura: Date, numeroReaperturas: number,
  prioridad: PrioridadSla, calendario: CalendarioLaboral) {
  if (!Number.isSafeInteger(numeroReaperturas) || numeroReaperturas < 0 || !Number.isSafeInteger(numeroReaperturas + 2)) {
    throw new RangeError('El número de reaperturas no es válido.');
  }
  if (!puedeReabrirTicket(fechaCierre, fechaReapertura, calendario)) throw new RangeError('Fuera del plazo de reapertura; corresponde un ticket nuevo con referencia al anterior.');
  return {
    numeroReaperturas: numeroReaperturas + 1, cicloSla: numeroReaperturas + 2,
    inicioCiclo: new Date(timestamp(fechaReapertura)), minutosPausa: 0,
    fechaPrimeraRespuesta: null, fechaResolucion: null, fechaCierre: null,
    slaRespuestaCumplido: null, slaSolucionCumplido: null,
    ...calcularFechasLimiteSla(fechaReapertura, prioridad, calendario),
  };
}
