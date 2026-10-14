import { z } from 'zod';

export const estadoArticuloSchema = z.enum(['BORRADOR', 'PUBLICADO', 'ARCHIVADO']);
export const visibilidadArticuloSchema = z.enum(['PUBLICO', 'INTERNO']);
export const knowledgeParamsSchema = z.object({ idArticulo: z.coerce.number().int().positive() });
export const knowledgeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().trim().max(150).optional(), idCategoria: z.coerce.number().int().positive().optional(),
  estado: estadoArticuloSchema.optional(), sort: z.enum(['titulo', '-titulo', '-publicadoEn']).default('-publicadoEn'),
});
export const knowledgeCreateSchema = z.object({
  titulo: z.string().trim().min(3).max(150), resumen: z.string().trim().max(300).nullable(),
  contenido: z.string().trim().min(10).max(100_000), idCategoria: z.number().int().positive(),
  estado: estadoArticuloSchema, visibilidad: visibilidadArticuloSchema,
  motivoCambio: z.string().trim().min(3).max(200),
});
export const knowledgeUpdateSchema = knowledgeCreateSchema.extend({ versionActual: z.number().int().positive() });
export const knowledgeSchema = z.object({
  idArticulo: z.number().int().positive(), titulo: z.string(), resumen: z.string().nullable(),
  idCategoria: z.number().int().positive(), categoria: z.string(), autor: z.string(),
  estado: estadoArticuloSchema, visibilidad: visibilidadArticuloSchema, versionActual: z.number().int().positive(),
  publicadoEn: z.iso.datetime().nullable(), totalVistas: z.number().int().nonnegative(),
});
export const knowledgeVersionSchema = z.object({
  numeroVersion: z.number().int().positive(), titulo: z.string(), contenido: z.string(),
  editadoPor: z.string(), fechaEdicion: z.iso.datetime(), motivoCambio: z.string().nullable(),
});
export const knowledgeDetailSchema = knowledgeSchema.extend({
  contenido: z.string(), revisor: z.string().nullable(), versiones: z.array(knowledgeVersionSchema),
});
export const knowledgeListSchema = z.object({ data: z.array(knowledgeSchema),
  meta: z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }) });
export const knowledgeCatalogSchema = z.object({ categorias: z.array(z.object({ idCategoria: z.number().int(), nombre: z.string() })) });
export type KnowledgeQuery = z.infer<typeof knowledgeQuerySchema>;
export type KnowledgeCreate = z.infer<typeof knowledgeCreateSchema>;
export type KnowledgeUpdate = z.infer<typeof knowledgeUpdateSchema>;
export type Knowledge = z.infer<typeof knowledgeSchema>;
export type KnowledgeDetail = z.infer<typeof knowledgeDetailSchema>;
export type KnowledgeList = z.infer<typeof knowledgeListSchema>;
export type KnowledgeCatalog = z.infer<typeof knowledgeCatalogSchema>;
