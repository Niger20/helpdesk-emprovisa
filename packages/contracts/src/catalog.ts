import { z } from 'zod';
import { tipoTicketSchema } from './domain.js';

export const categoryInputSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(80), idPadre: z.number().int().positive().nullable(),
  tipoAplicable: z.union([tipoTicketSchema, z.literal('AMBOS')]), requiereActivo: z.boolean(),
  idGrupoDefault: z.number().int().positive().nullable(), orden: z.number().int().min(0).max(32767), activa: z.boolean(),
});
export const categorySchema = categoryInputSchema.extend({ idCategoria: z.number().int().positive(),
  padre: z.string().nullable(), grupoDefault: z.string().nullable() });
export const categoryUpdateSchema = categoryInputSchema.extend({ anterior: categoryInputSchema });
export const categoryParamsSchema = z.object({ idCategoria: z.coerce.number().int().positive() });
export const categoryQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20), q: z.string().trim().max(80).default(''),
  estado: z.enum(['TODAS', 'ACTIVAS', 'INACTIVAS']).default('TODAS') });
export const categoryListSchema = z.object({ data: z.array(categorySchema),
  meta: z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }) });
export const categoryCatalogSchema = z.object({ categorias: z.array(categoryInputSchema.extend({ idCategoria: z.number().int() })),
  grupos: z.array(z.object({ idGrupo: z.number().int(), nombre: z.string(), nivel: z.number().int(), sede: z.string().nullable() })) });
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
export type CategoryList = z.infer<typeof categoryListSchema>;
export type CategoryCatalog = z.infer<typeof categoryCatalogSchema>;
