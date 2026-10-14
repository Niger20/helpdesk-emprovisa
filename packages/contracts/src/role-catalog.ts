import { z } from 'zod';
import { permisoSchema } from './permissions.js';
import { rolSchema } from './domain.js';

export const roleCodeSchema = z.string().trim().min(3).max(30).regex(/^[A-Z][A-Z0-9_]+$/)
  .refine((code) => !rolSchema.safeParse(code).success, 'El código está reservado para un rol del sistema.');
export const roleCatalogInputSchema = z.strictObject({ codigo: roleCodeSchema, nombre: z.string().trim().min(2).max(60),
  descripcion: z.string().trim().max(200).nullable(), permisos: z.array(permisoSchema).min(1).max(50) })
  .refine((value) => new Set(value.permisos).size === value.permisos.length, { path: ['permisos'], message: 'No repitás permisos.' })
  .refine((value) => value.permisos.includes('auth.sesion'), { path: ['permisos'], message: 'El rol requiere acceso a sesión.' });
export const roleCatalogRoleSchema = z.object({ idRol: z.number().int().positive(), codigo: z.string(), nombre: z.string(),
  descripcion: z.string().nullable(), esSistema: z.boolean(), permisos: z.array(permisoSchema) });
export const permissionCatalogSchema = z.array(z.object({ codigo: permisoSchema, modulo: z.string(), accion: z.string(), descripcion: z.string().nullable() }));
export const roleCatalogSchema = z.object({ roles: z.array(roleCatalogRoleSchema), permisos: permissionCatalogSchema });
export const roleCatalogUpdateSchema = z.strictObject({ datos: roleCatalogInputSchema,
  anterior: roleCatalogRoleSchema.omit({ idRol: true, esSistema: true }) });
export type RoleCatalogInput = z.infer<typeof roleCatalogInputSchema>;
export type RoleCatalogRole = z.infer<typeof roleCatalogRoleSchema>;
export type RoleCatalog = z.infer<typeof roleCatalogSchema>;
export type RoleCatalogUpdate = z.infer<typeof roleCatalogUpdateSchema>;
