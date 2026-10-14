import type { Reports, ReportsQuery } from '@helpdesk/contracts';
import type { ReportRow } from '../reports.repository.js';
import { reportCivilDate } from './date-range.js';

const percent = (sum: number, count: number) => count ? sum / count * 100 : null;
const average = (sum: number, count: number) => count ? sum / count : null;
const minutes = (end: Date, start: Date) => Math.max(0, (end.getTime() - start.getTime()) / 60_000);
function groups(rows: ReportRow[], key: 'estado' | 'prioridad' | 'sede' | 'categoria') {
  const result = new Map<string, number>();
  rows.forEach((row) => result.set(row[key], (result.get(row[key]) ?? 0) + 1));
  return [...result].map(([etiqueta, total]) => ({ etiqueta, total })).sort((a, b) => b.total - a.total || a.etiqueta.localeCompare(b.etiqueta));
}
export function calculateReport(rows: ReportRow[], filtros: ReportsQuery, now: Date): Reports {
  const resolved = rows.filter((row) => row.fechaResolucion !== null);
  const responses = rows.filter((row) => row.fechaPrimeraRespuesta !== null);
  const evaluated = resolved.filter((row) => row.slaSolucionCumplido !== null);
  const surveys = rows.filter((row) => row.respondidaEn !== null && row.calificacion !== null);
  const fulfilled = evaluated.filter((row) => row.slaSolucionCumplido).length;
  const ratings = surveys.reduce((sum, row) => sum + (row.calificacion ?? 0), 0);
  const carga = new Map<number | null, { analista: string; abiertos: number; resueltos: number }>();
  const homonyms = new Map<string, Set<number>>();
  for (const row of rows) if (row.analista && row.idAnalista !== null) {
    const ids = homonyms.get(row.analista) ?? new Set<number>(); ids.add(row.idAnalista); homonyms.set(row.analista, ids);
  }
  const diario = new Map<string, { fecha: string; creados: number; resueltos: number }>();
  const day = (fecha: string) => {
    const value = diario.get(fecha) ?? { fecha, creados: 0, resueltos: 0 }; diario.set(fecha, value); return value;
  };
  rows.forEach((row) => {
    day(reportCivilDate(row.fechaCreacion)).creados++;
    if (row.fechaResolucion) {
      const fecha = reportCivilDate(row.fechaResolucion);
      if (fecha >= filtros.desde && fecha <= filtros.hasta) day(fecha).resueltos++;
    }
    const analista = row.analista ? row.analista + ((homonyms.get(row.analista)?.size ?? 0) > 1 ? ` · ${row.username}` : '') : 'Sin asignar';
    const value = carga.get(row.idAnalista) ?? { analista, abiertos: 0, resueltos: 0 };
    if (row.fechaResolucion) value.resueltos++; else if (row.estado !== 'CANCELADO' && row.estado !== 'CERRADO') value.abiertos++;
    carga.set(row.idAnalista, value);
  });
  return { filtros, generadoEn: now.toISOString(), resumen: {
    total: rows.length, respondidos: responses.length, resueltos: resolved.length,
    mttaMinutos: average(responses.reduce((sum, row) => sum + (row.fechaPrimeraRespuesta ? minutes(row.fechaPrimeraRespuesta, row.fechaCreacion) : 0), 0), rows.length),
    mttrMinutos: average(resolved.reduce((sum, row) => sum + (row.fechaResolucion ? Math.max(0, minutes(row.fechaResolucion, row.fechaCreacion) - row.minutosPausa) : 0), 0), resolved.length),
    slaEvaluados: evaluated.length, slaCumplidos: fulfilled, cumplimientoSla: percent(fulfilled, resolved.length),
    encuestasRespondidas: surveys.length, csatPromedio: average(ratings, surveys.length), csatPorcentaje: percent(ratings, surveys.length * 5),
  }, porEstado: groups(rows, 'estado'), porPrioridad: groups(rows, 'prioridad'), porSede: groups(rows, 'sede'), porCategoria: groups(rows, 'categoria'),
  slaPorPrioridad: groups(rows, 'prioridad').map(({ etiqueta }) => {
    const subset = resolved.filter((row) => row.prioridad === etiqueta); const cumplidos = subset.filter((row) => row.slaSolucionCumplido === true).length;
    return { etiqueta, resueltos: subset.length, evaluados: subset.filter((row) => row.slaSolucionCumplido !== null).length, cumplidos, porcentaje: percent(cumplidos, subset.length) };
  }), cargaPorAnalista: [...carga.values()].sort((a, b) => a.analista.localeCompare(b.analista)), volumenDiario: [...diario.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)) };
}
