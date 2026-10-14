import { describe, expect, it } from 'vitest';
import { reportsQuerySchema, reportsSchema } from '@helpdesk/contracts';
import { calculateReport } from '../domain/metrics.js';
import { reportDateRange } from '../domain/date-range.js';
import { safeCell } from '../domain/export-cells.js';
import { reportsAccess, assertReportSede } from '../reports.policies.js';
import { exportExcel } from '../exports/excel.js';
import { exportPdf } from '../exports/pdf.js';
import type { ReportRow } from '../reports.repository.js';
import type { SessionContext } from '../../auth/index.js';
import ExcelJS from 'exceljs';

const filters = { desde: '2026-10-01', hasta: '2026-10-31' };
const now = new Date('2026-10-13T18:00:00Z');
const row = (patch: Partial<ReportRow> = {}): ReportRow => ({ fechaCreacion: new Date('2026-10-01T06:00:00Z'),
  fechaPrimeraRespuesta: new Date('2026-10-01T06:30:00Z'), fechaResolucion: new Date('2026-10-01T08:00:00Z'),
  minutosPausa: 30, slaSolucionCumplido: true, estado: 'RESUELTO', prioridad: 'P1', sede: 'Managua', categoria: 'Hardware',
  analista: 'Analista ficticio', idAnalista: 1, username: 'analista.demo', calificacion: 4, respondidaEn: now, ...patch });
const context = (sedes: (number | null)[]): SessionContext => ({ idSesion: 'prueba', csrfToken: 'prueba', expiraEn: now, idleMinutes: 30,
  usuario: { idUsuario: 1, username: 'auditor', nombreCompleto: 'Auditor ficticio', sede: { idSede: 1, codigo: 'MGA', nombre: 'Managua' },
    roles: [{ codigo: 'AUDITOR', idSedeAlcance: null }], permisos: ['reporte.ver', 'reporte.exportar'] },
  grants: sedes.map((idSedeAlcance) => ({ codigo: 'reporte.ver', idSedeAlcance })) });

describe('Reportes: métricas, rango y exportaciones', () => {
  it('valida fechas civiles reales y límites inclusivos de Managua', () => {
    expect(reportsQuerySchema.safeParse({ desde: '2026-02-30', hasta: '2026-03-01' }).success).toBe(false);
    expect(reportsQuerySchema.safeParse({ ...filters, hasta: '2026-09-30' }).success).toBe(false);
    const range = reportDateRange({ desde: '2026-10-01', hasta: '2026-10-01' });
    expect(range.desde.toISOString()).toBe('2026-10-01T06:00:00.000Z');
    expect(range.hasta.toISOString()).toBe('2026-10-02T06:00:00.000Z');
  });
  it('aplica denominadores, pausas y cumplimiento al resolver; excluye reapertura vigente', () => {
    const report = calculateReport([row(), row({ fechaPrimeraRespuesta: null, fechaResolucion: null, slaSolucionCumplido: true,
      estado: 'REABIERTO', calificacion: null, respondidaEn: null }), row({ slaSolucionCumplido: false, calificacion: 5 })], filters, now);
    expect(report.resumen).toMatchObject({ total: 3, respondidos: 2, resueltos: 2, mttaMinutos: 20, mttrMinutos: 90,
      slaEvaluados: 2, slaCumplidos: 1, cumplimientoSla: 50, encuestasRespondidas: 2, csatPromedio: 4.5, csatPorcentaje: 90 });
    expect(report.slaPorPrioridad[0]?.porcentaje).toBe(50);
    expect(report.cargaPorAnalista[0]).toMatchObject({ abiertos: 1, resueltos: 2 });
    expect(reportsSchema.safeParse(report).success).toBe(true);
  });
  it('no fabrica porcentajes con denominador vacío ni resoluciones no evaluadas', () => {
    expect(calculateReport([], filters, now).resumen).toMatchObject({ total: 0, mttaMinutos: null, cumplimientoSla: null, csatPorcentaje: null });
    expect(calculateReport([row({ slaSolucionCumplido: null })], filters, now).resumen.slaEvaluados).toBe(0);
  });
  it('separa la carga de dos analistas con el mismo nombre', () => {
    const report = calculateReport([row(), row({ idAnalista: 2, username: 'otro.analista' })], filters, now);
    expect(report.cargaPorAnalista).toHaveLength(2);
    expect(report.cargaPorAnalista.every((analyst) => analyst.resueltos === 1)).toBe(true);
    expect(new Set(report.cargaPorAnalista.map((analyst) => analyst.analista)).size).toBe(2);
  });
  it('rechaza sesión, permisos ausentes y sedes fuera del alcance; intersecta exportar', () => {
    expect(() => reportsAccess(null)).toThrow();
    expect(reportsAccess(context([1, 2]))).toEqual([1, 2]);
    expect(() => assertReportSede([1], 2)).toThrow();
    expect(() => reportsAccess(context([null]), true)).toThrow();
    const access = context([1, 2]); access.grants.push({ codigo: 'reporte.exportar', idSedeAlcance: 2 });
    expect(reportsAccess(access, true)).toEqual([2]);
    expect(reportsAccess(context([null]))).toBeNull();
  });
  it('neutraliza fórmulas y produce XLSX numérico y PDF con fuentes locales', async () => {
    expect(safeCell(' =SUM(A1)')).toBe("' =SUM(A1)"); expect(safeCell('@cmd')).toBe("'@cmd");
    const report = calculateReport([row({ categoria: '=1+1', analista: '+Fórmula' })], filters, now);
    const labels = { sede: 'Sede Managua', categoria: '=1+1' };
    const workbook = new ExcelJS.Workbook(); const bytes = await exportExcel(report, labels);
    await workbook.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    expect(workbook.getWorksheet('Por categoría')?.getCell('A2').value).toBe("'=1+1");
    expect(workbook.getWorksheet('Por categoría')?.getCell('B2').value).toBe(1);
    expect(workbook.getWorksheet('Filtros y metodología')?.getCell('B5').value).toBe("'=1+1");
    expect(workbook.getWorksheet('Filtros y metodología')?.getCell('B6').value).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect((await exportPdf(report, labels)).subarray(0, 5).toString()).toBe('%PDF-');
    expect((await exportPdf(calculateReport([], filters, now), labels)).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
