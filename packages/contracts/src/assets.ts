import { z } from 'zod';
import { estadoTicketSchema } from './domain.js';
import { numeroTicketSchema } from './tickets.js';

export const estadoActivoSchema = z.enum(['ACTIVO', 'MANTENIMIENTO', 'BAJA']);
const id = z.number().int().positive();
const nullableText = (max: number) => z.string().trim().max(max).nullable();
export const assetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).default(''), idSede: z.coerce.number().int().positive().optional(),
  idTipoActivo: z.coerce.number().int().positive().optional(), estado: estadoActivoSchema.optional(),
  sort: z.enum(['codigoPatrimonial', '-codigoPatrimonial']).default('codigoPatrimonial'),
}).strict();
export const assetParamsSchema = z.object({ codigoPatrimonial: z.string().trim().min(1).max(20) }).strict();
export const assetCreateSchema = z.object({
  codigoPatrimonial: z.string().trim().min(1, 'Ingresá el código patrimonial.').max(20).regex(/^[A-Z0-9-]+$/, 'Usá letras mayúsculas, números y guiones.'),
  idTipoActivo: id, marca: nullableText(50), modelo: nullableText(80), numeroSerie: nullableText(60),
  descripcion: z.string().trim().min(1, 'Ingresá una descripción.').max(4000),
  idSede: id, idCustodio: id.nullable(), estado: estadoActivoSchema,
  actaNumero: z.string().trim().min(1, 'Ingresá el número del acta F-ACT-01.').max(30),
  fechaAdquisicion: z.iso.date().nullable(), garantiaHasta: z.iso.date().nullable(),
}).strict().refine((data) => !data.fechaAdquisicion || !data.garantiaHasta || data.garantiaHasta >= data.fechaAdquisicion,
  { message: 'La garantía no puede terminar antes de la adquisición.', path: ['garantiaHasta'] });
const sedeSchema = z.object({ idSede: id, nombre: z.string() });
const custodioSchema = z.object({ idUsuario: id, nombreCompleto: z.string(), idSede: id });
const tipoSchema = z.object({ idTipoActivo: id, nombre: z.string(), familia: z.string() });
export const assetSchema = z.object({
  idActivo: id, codigoPatrimonial: z.string(), descripcion: z.string(),
  marca: z.string().nullable(), modelo: z.string().nullable(), numeroSerie: z.string().nullable(),
  estado: estadoActivoSchema, actaNumero: z.string(), fechaAdquisicion: z.iso.date().nullable(), garantiaHasta: z.iso.date().nullable(),
  sede: sedeSchema, tipoActivo: tipoSchema, custodio: custodioSchema.nullable(),
});
export const assetListSchema = z.object({ data: z.array(assetSchema), meta: z.object({ page: id, pageSize: id, total: z.number().int().nonnegative() }) });
export const assetDetailSchema = assetSchema.extend({ custodiaHistorial: z.array(z.object({
  idCustodia: id, custodio: z.string(), desde: z.iso.date(), hasta: z.iso.date().nullable(), actaNumero: z.string(), registradoPor: z.string(),
})), incidentes: z.array(z.object({ numero: numeroTicketSchema, titulo: z.string(), estado: estadoTicketSchema, fechaCreacion: z.iso.datetime() })) });
export const assetCatalogSchema = z.object({ sedes: z.array(sedeSchema), tiposActivo: z.array(tipoSchema), custodios: z.array(custodioSchema) });
export type EstadoActivo = z.infer<typeof estadoActivoSchema>;
export type AssetQuery = z.infer<typeof assetQuerySchema>;
export type AssetCreate = z.infer<typeof assetCreateSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetList = z.infer<typeof assetListSchema>;
export type AssetDetail = z.infer<typeof assetDetailSchema>;
export type AssetCatalog = z.infer<typeof assetCatalogSchema>;
