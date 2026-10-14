import { timestamp } from './sla-calendar.js';
import type { IntervaloSla, PausaSla } from './sla-types.js';

export function prepararPausas(pausas: readonly PausaSla[]): readonly IntervaloSla[] {
  const intervalos = pausas.map((pausa) => {
    if (!['REPUESTOS', 'PROVEEDOR_EXTERNO'].includes(pausa.motivo) || !pausa.detalle.trim()) {
      throw new RangeError('La pausa exige un motivo permitido y un detalle escrito.');
    }
    const inicio = timestamp(pausa.inicio);
    const fin = pausa.fin === null ? Infinity : timestamp(pausa.fin);
    if (fin < inicio) throw new RangeError('La pausa no puede terminar antes de iniciar.');
    return { inicio, fin };
  }).filter((intervalo) => intervalo.fin > intervalo.inicio).sort((a, b) => a.inicio - b.inicio);
  const resultado: IntervaloSla[] = [];
  for (const intervalo of intervalos) {
    const previo = resultado.at(-1);
    if (previo && intervalo.inicio <= previo.fin) {
      resultado[resultado.length - 1] = { inicio: previo.inicio, fin: Math.max(previo.fin, intervalo.fin) };
    } else resultado.push(intervalo);
  }
  return resultado;
}

export function* quitarPausas(ventana: IntervaloSla, pausas: readonly IntervaloSla[]): Generator<IntervaloSla> {
  let cursor = ventana.inicio;
  for (const pausa of pausas) {
    if (pausa.fin <= cursor) continue;
    if (pausa.inicio >= ventana.fin) break;
    if (pausa.inicio > cursor) yield { inicio: cursor, fin: Math.min(pausa.inicio, ventana.fin) };
    cursor = Math.max(cursor, pausa.fin);
    if (cursor >= ventana.fin) return;
  }
  if (cursor < ventana.fin) yield { inicio: cursor, fin: ventana.fin };
}
