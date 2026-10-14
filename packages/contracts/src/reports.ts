import { z } from 'zod';

export const reportsQuerySchema = z.object({
  desde: z.iso.date(), hasta: z.iso.date(),
  idSede: z.coerce.number().int().positive().optional(),
  idCategoria: z.coerce.number().int().positive().optional(),
}).refine((value) => value.desde <= value.hasta, { message: 'El rango de fechas es inválido.', path: ['hasta'] });
export const reportsExportParamsSchema = z.object({ formato: z.enum(['pdf', 'xlsx']) });
const count = z.number().int().nonnegative();
const metric = z.number().nonnegative().nullable();
const group = z.object({ etiqueta: z.string(), total: count });
export const reportsSchema = z.object({
  filtros: reportsQuerySchema, generadoEn: z.iso.datetime(),
  resumen: z.object({ total: count, respondidos: count, resueltos: count, mttaMinutos: metric, mttrMinutos: metric,
    slaEvaluados: count, slaCumplidos: count, cumplimientoSla: metric, encuestasRespondidas: count, csatPromedio: metric, csatPorcentaje: metric }),
  porEstado: z.array(group), porPrioridad: z.array(group), porSede: z.array(group), porCategoria: z.array(group),
  slaPorPrioridad: z.array(z.object({ etiqueta: z.string(), resueltos: count, evaluados: count, cumplidos: count, porcentaje: metric })),
  cargaPorAnalista: z.array(z.object({ analista: z.string(), abiertos: count, resueltos: count })),
  volumenDiario: z.array(z.object({ fecha: z.iso.date(), creados: count, resueltos: count })),
});
export const reportsCatalogSchema = z.object({
  sedes: z.array(z.object({ idSede: z.number().int().positive(), nombre: z.string() })),
  categorias: z.array(z.object({ idCategoria: z.number().int().positive(), nombre: z.string() })),
});
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
export type Reports = z.infer<typeof reportsSchema>;
export type ReportsCatalog = z.infer<typeof reportsCatalogSchema>;
export type ReportsFormat = z.infer<typeof reportsExportParamsSchema>['formato'];
