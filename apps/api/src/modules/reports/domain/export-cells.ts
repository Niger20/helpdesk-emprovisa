import type { Reports } from '@helpdesk/contracts';

export const safeCell = (value: string) => /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `'${value}` : value;
export const civilLabel = (value: string) => value.split('-').reverse().join('/');
export function reportSections(report: Reports) {
  const summary = report.resumen;
  return [
    { titulo: 'Indicadores', columnas: ['Indicador', 'Valor'], filas: [
      ['Tickets', summary.total], ['Respondidos', summary.respondidos], ['Resueltos', summary.resueltos],
      ['MTTA (minutos)', summary.mttaMinutos], ['MTTR (minutos)', summary.mttrMinutos],
      ['SLA evaluados', summary.slaEvaluados], ['SLA cumplidos', summary.slaCumplidos], ['SLA (%)', summary.cumplimientoSla],
      ['Encuestas respondidas', summary.encuestasRespondidas], ['CSAT (1 a 5)', summary.csatPromedio], ['CSAT (%)', summary.csatPorcentaje],
    ] },
    ...(['porEstado', 'porPrioridad', 'porSede', 'porCategoria'] as const).map((key, index) => ({
      titulo: ['Por estado', 'Por prioridad', 'Por sede', 'Por categoría'][index] ?? key,
      columnas: ['Clasificación', 'Tickets'], filas: report[key].map((value) => [value.etiqueta, value.total]),
    })),
    { titulo: 'SLA por prioridad', columnas: ['Prioridad', 'Resueltos', 'Evaluados', 'Cumplidos', 'Cumplimiento (%)'],
      filas: report.slaPorPrioridad.map((value) => [value.etiqueta, value.resueltos, value.evaluados, value.cumplidos, value.porcentaje]) },
    { titulo: 'Carga por analista', columnas: ['Analista asignado', 'Abiertos', 'Resueltos'],
      filas: report.cargaPorAnalista.map((value) => [value.analista, value.abiertos, value.resueltos]) },
    { titulo: 'Volumen diario', columnas: ['Fecha', 'Creados', 'Resueltos de la cohorte'],
      filas: report.volumenDiario.map((value) => [civilLabel(value.fecha), value.creados, value.resueltos]) },
  ];
}
export const reportMethod = 'Cohorte por creación en America/Managua. MTTA: suma hasta primera respuesta / total de tickets (sin respuesta aportan cero). MTTR: resolución vigente menos creación y pausas / resueltos. SLA: cumplidos según marcas al resolver / total resueltos; sin evaluación no se considera cumplido. CSAT: suma calificaciones / (respuestas × 5). Carga: asignación actual.';
