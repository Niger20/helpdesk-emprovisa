import ExcelJS from 'exceljs';
import type { Reports } from '@helpdesk/contracts';
import { civilLabel, reportMethod, reportSections, safeCell } from '../domain/export-cells.js';
import { reportGeneratedLabel } from '../domain/export-labels.js';

export async function exportExcel(report: Reports, labels: { sede: string; categoria: string }) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'EMPROVISA';
  const info = workbook.addWorksheet('Filtros y metodología');
  info.addRows([['Reporte ejecutivo EMPROVISA'], ['Desde', civilLabel(report.filtros.desde)], ['Hasta', civilLabel(report.filtros.hasta)],
    ['Sede', safeCell(labels.sede)], ['Categoría', safeCell(labels.categoria)],
    ['Generado (Managua)', reportGeneratedLabel(report.generadoEn)], ['Metodología', reportMethod]]);
  info.columns = [{ width: 28 }, { width: 100 }]; info.getRow(7).alignment = { wrapText: true }; info.getRow(7).height = 90;
  for (const section of reportSections(report)) {
    const sheet = workbook.addWorksheet(section.titulo);
    sheet.addRow(section.columnas); sheet.getRow(1).font = { bold: true, color: { argb: 'FF13315C' } };
    section.filas.forEach((row) => sheet.addRow(row.map((cell) => typeof cell === 'string' ? safeCell(cell) : cell)));
    sheet.columns.forEach((column) => { column.width = 30; }); sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
