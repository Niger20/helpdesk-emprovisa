import pdfmake from 'pdfmake';
import { createRequire } from 'node:module';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces.js';
import type { Reports } from '@helpdesk/contracts';
import { civilLabel, reportMethod, reportSections } from '../domain/export-cells.js';
import { reportGeneratedLabel } from '../domain/export-labels.js';

export async function exportPdf(report: Reports, labels: { sede: string; categoria: string }) {
  const require = createRequire(import.meta.url);
  const font = (name: string) => require.resolve(`pdfmake/fonts/Roboto/Roboto-${name}.ttf`);
  pdfmake.addFonts({ Roboto: { normal: font('Regular'), bold: font('Medium'), italics: font('Italic'), bolditalics: font('MediumItalic') } });
  const content: Content[] = [
    { text: 'Reporte ejecutivo EMPROVISA', fontSize: 18, bold: true, color: '#13315C' },
    { text: `${civilLabel(report.filtros.desde)} al ${civilLabel(report.filtros.hasta)} · America/Managua`, margin: [0, 8, 0, 8] },
    { text: `Sede: ${labels.sede} · Categoría: ${labels.categoria}` },
    { text: `Generado: ${reportGeneratedLabel(report.generadoEn)} · America/Managua`, fontSize: 9 },
    { text: reportMethod, fontSize: 9, margin: [0, 8, 0, 12] },
  ];
  for (const section of reportSections(report)) {
    content.push({ text: section.titulo, bold: true, fontSize: 13, margin: [0, 12, 0, 6] },
      { table: { headerRows: 1, widths: section.columnas.map(() => '*'), body: [section.columnas.map((text) => ({ text, bold: true })),
        ...section.filas.map((row) => row.map((cell) => cell === null ? 'Sin datos' : typeof cell === 'number' ? cell.toLocaleString('es-NI', { maximumFractionDigits: 2 }) : cell))] }, layout: 'lightHorizontalLines' });
  }
  const definition: TDocumentDefinitions = { content, defaultStyle: { font: 'Roboto', fontSize: 10 }, pageSize: 'A4',
    footer: (page, pages) => ({ text: `${page} / ${pages}`, alignment: 'center', fontSize: 9 }) };
  return pdfmake.createPdf(definition).getBuffer();
}
