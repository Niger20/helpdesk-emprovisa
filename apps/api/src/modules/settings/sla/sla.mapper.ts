import { createHash } from 'node:crypto';
import { impactoSchema, urgenciaSchema, prioridadSchema, slaNormativa, matrizNormativa, slaSettingsSchema } from '@helpdesk/contracts';
import type { SlaSettingsRows } from './sla.repository.js';

export function mapSlaSettings(rows: SlaSettingsRows) {
  const prioridades = rows.prioridades.map((row) => {
    const codigo = prioridadSchema.parse(row.codigo); const normativa = slaNormativa[codigo];
    return { codigo, nombre: row.nombre, activa: row.activa, minutosRespuesta: row.minutosRespuesta, minutosSolucion: row.minutosSolucion,
      modoCalendario: row.modoCalendario, porcentajeAlerta: row.porcentajeAlerta, normativa,
      cumpleNormativa: row.activa && row.minutosRespuesta === normativa.minutosRespuesta && row.minutosSolucion === normativa.minutosSolucion &&
        row.modoCalendario === normativa.modoCalendario && row.porcentajeAlerta === normativa.porcentajeAlerta };
  });
  const matriz = rows.matriz.map((row) => {
    const impacto = impactoSchema.parse(row.impacto); const urgencia = urgenciaSchema.parse(row.urgencia);
    const prioridad = prioridadSchema.parse(row.prioridad); const prioridadNormativa = matrizNormativa[impacto][urgencia];
    return { impacto, urgencia, prioridad, prioridadNormativa, cumpleNormativa: prioridad === prioridadNormativa };
  }).sort((left, right) => impactoSchema.options.indexOf(left.impacto) - impactoSchema.options.indexOf(right.impacto) ||
    urgenciaSchema.options.indexOf(left.urgencia) - urgenciaSchema.options.indexOf(right.urgencia));
  const revision = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  const complete = prioridades.length === prioridadSchema.options.length && matriz.length === impactoSchema.options.length * urgenciaSchema.options.length;
  return slaSettingsSchema.parse({ prioridades, matriz, revision, cumpleNormativa: complete && prioridades.every((row) => row.cumpleNormativa) && matriz.every((row) => row.cumpleNormativa) });
}
