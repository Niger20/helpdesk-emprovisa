import { knowledgeSchema } from '@helpdesk/contracts';
import type { KnowledgeRow } from './knowledge.repository.js';

export function mapKnowledge(row: KnowledgeRow) {
  return knowledgeSchema.parse({ idArticulo: row.idArticulo, titulo: row.titulo, resumen: row.resumen,
    idCategoria: row.idCategoria, categoria: row.categoria, autor: row.autor, estado: row.estado,
    visibilidad: row.visibilidad, versionActual: row.versionActual, publicadoEn: row.publicadoEn?.toISOString() ?? null,
    totalVistas: row.totalVistas });
}
