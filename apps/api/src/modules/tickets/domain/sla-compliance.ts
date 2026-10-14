import { contarMinutosSla, validarPrioridad } from './sla-calculator.js';
import type { CalendarioLaboral, PausaSla, PrioridadSla } from './sla-types.js';

export function evaluarCumplimientoSla(inicioCiclo: Date, primeraRespuesta: Date | null, resolucion: Date,
  prioridad: PrioridadSla, calendario: CalendarioLaboral, pausas: readonly PausaSla[] = []) {
  validarPrioridad(prioridad);
  if (primeraRespuesta && primeraRespuesta.getTime() > resolucion.getTime()) throw new RangeError('La primera respuesta no puede ser posterior a la resolución.');
  const reloj = { modoCalendario: prioridad.modoCalendario, calendario, pausas };
  const minutosSolucion = contarMinutosSla(inicioCiclo, resolucion, reloj);
  const minutosRespuesta = primeraRespuesta ? contarMinutosSla(inicioCiclo, primeraRespuesta, reloj) : null;
  return {
    minutosRespuesta, minutosSolucion,
    slaRespuestaCumplido: minutosRespuesta !== null && minutosRespuesta <= prioridad.minutosRespuesta,
    slaSolucionCumplido: minutosSolucion <= prioridad.minutosSolucion,
  };
}
