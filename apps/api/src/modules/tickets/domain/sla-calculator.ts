import { timestamp, prepararCalendario, ventanasLaborales } from './sla-calendar.js';
import { prepararPausas, quitarPausas } from './sla-pauses.js';
import type { CalendarioLaboral, FechasLimiteSla, PausaSla, PrioridadSla, RelojSla } from './sla-types.js';

function validarMinutos(minutos: number): number {
  const milisegundos = Math.round(minutos * 60_000);
  if (minutos < 0 || !Number.isSafeInteger(milisegundos)) throw new RangeError('Los minutos del SLA deben ser finitos, positivos o cero y estar dentro del rango seguro.');
  return milisegundos;
}

export function validarPrioridad(prioridad: PrioridadSla) {
  if (!Number.isInteger(prioridad.minutosRespuesta) || prioridad.minutosRespuesta <= 0
    || !Number.isInteger(prioridad.minutosSolucion) || prioridad.minutosSolucion < prioridad.minutosRespuesta
    || !Number.isInteger(prioridad.porcentajeAlerta) || prioridad.porcentajeAlerta <= 0 || prioridad.porcentajeAlerta >= 100) {
    throw new RangeError('Los plazos y el porcentaje de alerta no son válidos.');
  }
}

export function sumarMinutosSla(inicio: Date, minutos: number, reloj: RelojSla): Date | null {
  const desde = timestamp(inicio);
  let restante = validarMinutos(minutos);
  if (!['CONTINUO', 'LABORAL'].includes(reloj.modoCalendario)) throw new RangeError('El modo de calendario no es válido.');
  const pausas = prepararPausas(reloj.pausas ?? []);
  const calendario = reloj.modoCalendario === 'LABORAL' ? prepararCalendario(reloj.calendario) : null;
  if (restante === 0) return new Date(desde);
  const abierta = pausas.find((pausa) => pausa.fin === Infinity);
  const limiteFecha = 8_640_000_000_000_000;
  const ventanas = calendario ? ventanasLaborales(desde, limiteFecha, calendario) : [{ inicio: desde, fin: limiteFecha }];
  for (const ventana of ventanas) {
    if (abierta && abierta.inicio <= ventana.inicio) return null;
    for (const activa of quitarPausas(ventana, pausas)) {
      const disponible = activa.fin - activa.inicio;
      if (restante <= disponible) return new Date(activa.inicio + restante);
      restante -= disponible;
    }
    if (abierta && abierta.inicio < ventana.fin) return null;
  }
  throw new RangeError('El plazo excede el rango de fechas.');
}

export function contarMinutosSla(inicio: Date, fin: Date, reloj: RelojSla): number {
  const desde = timestamp(inicio);
  const hasta = timestamp(fin);
  if (hasta < desde) throw new RangeError('El fin del ciclo no puede ser anterior al inicio.');
  if (!['CONTINUO', 'LABORAL'].includes(reloj.modoCalendario)) throw new RangeError('El modo de calendario no es válido.');
  const pausas = prepararPausas(reloj.pausas ?? []);
  const ventanas = reloj.modoCalendario === 'LABORAL'
    ? ventanasLaborales(desde, hasta, prepararCalendario(reloj.calendario)) : [{ inicio: desde, fin: hasta }];
  let total = 0;
  for (const ventana of ventanas) for (const activa of quitarPausas(ventana, pausas)) total += activa.fin - activa.inicio;
  return total / 60_000;
}

export function calcularFechasLimiteSla(inicio: Date, prioridad: PrioridadSla, calendario: CalendarioLaboral, pausas: readonly PausaSla[] = []): FechasLimiteSla {
  validarPrioridad(prioridad);
  const reloj = { modoCalendario: prioridad.modoCalendario, calendario, pausas };
  const porcentaje = prioridad.porcentajeAlerta / 100;
  return {
    fechaLimiteRespuesta: sumarMinutosSla(inicio, prioridad.minutosRespuesta, reloj),
    fechaLimiteSolucion: sumarMinutosSla(inicio, prioridad.minutosSolucion, reloj),
    fechaAlertaRespuesta: sumarMinutosSla(inicio, prioridad.minutosRespuesta * porcentaje, reloj),
    fechaAlertaSolucion: sumarMinutosSla(inicio, prioridad.minutosSolucion * porcentaje, reloj),
  };
}
