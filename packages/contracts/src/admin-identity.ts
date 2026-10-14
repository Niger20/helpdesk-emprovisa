import { z } from 'zod';
import { permisoSchema } from './permissions.js';

const id = z.number().int().positive();
const date = z.iso.date();
const nullableText = (length: number) => z.string().trim().max(length).nullable();
export const adminParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const adminQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).default('') });
export const localPasswordSchema = z.string().min(12).max(128);
export const userEditSchema = z.strictObject({ nombreCompleto: z.string().trim().min(2).max(100), correo: z.email().max(120),
  cargo: nullableText(80), extension: nullableText(10), idSede: id, idDepartamento: id.nullable(), idJefeInmediato: id.nullable() });
export const userCreateSchema = userEditSchema.extend({ username: z.string().trim().toLowerCase().min(3).max(50).regex(/^[a-z0-9._-]+$/), password: localPasswordSchema });
export const userFormSchema = userCreateSchema.omit({ password: true }).extend({ idUsuario: id.nullable(), password: z.string().max(128) })
  .refine((value) => value.idUsuario !== null || localPasswordSchema.safeParse(value.password).success,
    { path: ['password'], message: 'Usá una contraseña de entre 12 y 128 caracteres.' });
export const passwordResetSchema = z.strictObject({ password: localPasswordSchema });
export const userStateSchema = z.strictObject({ activo: z.boolean() });
export const adminUserSchema = userEditSchema.extend({ idUsuario: id, username: z.string(), estado: z.string(), origenCuenta: z.literal('LOCAL'),
  bloqueadoHasta: z.iso.datetime().nullable(), intentosFallidos: z.number().int(), sedeNombre: z.string() });
const meta = z.object({ page: id, pageSize: id, total: z.number().int().nonnegative() });
export const adminUserListSchema = z.object({ data: z.array(adminUserSchema), meta });
export const roleAssignmentSchema = z.strictObject({ idRol: id, idSedeAlcance: id.nullable(), vigenteDesde: date, vigenteHasta: date.nullable() })
  .refine((v) => !v.vigenteHasta || v.vigenteHasta >= v.vigenteDesde, { message: 'La fecha final debe ser posterior al inicio.', path: ['vigenteHasta'] });
export const roleLinkSchema = z.object({ idUsuarioRol: id, idUsuario: id, idRol: id, idSedeAlcance: id.nullable(), vigenteDesde: date,
  vigenteHasta: date.nullable(), asignadoPor: id, nombre: z.string(), codigo: z.string() });
export const roleLinksSchema = z.array(roleLinkSchema);
export const rolesCatalogSchema = z.array(z.object({ idRol: id, codigo: z.string(), nombre: z.string(), esSistema: z.boolean(), permisos: z.array(permisoSchema) }));
export const groupInputSchema = z.strictObject({ nombre: z.string().trim().min(2).max(80), nivel: z.number().int().min(1).max(2),
  idSede: id.nullable(), correoGrupo: z.email().max(120).nullable(), activo: z.boolean() });
export const groupSchema = groupInputSchema.extend({ idGrupo: id });
export const groupsListSchema = z.object({ data: z.array(groupSchema), meta });
export const membershipSchema = z.strictObject({ idUsuario: id, esCoordinador: z.boolean(), desde: date, hasta: date.nullable() })
  .refine((v) => !v.hasta || v.hasta >= v.desde, { message: 'La fecha final debe ser posterior al inicio.', path: ['hasta'] });
export const membersListSchema = z.array(z.object({ idGrupo: id, idUsuario: id, nombreCompleto: z.string(), esCoordinador: z.boolean(), desde: date, hasta: date.nullable() }));
export const specialtySchema = z.strictObject({ idCategoria: id, nivelDominio: z.number().int().min(1).max(32767) });
export const specialtiesListSchema = z.array(specialtySchema.extend({ nombre: z.string() }));
export const adminCatalogSchema = z.object({ sedes: z.array(z.object({ idSede: id, nombre: z.string() })),
  departamentos: z.array(z.object({ idDepartamento: id, idSede: id, nombre: z.string() })),
  usuarios: z.array(z.object({ idUsuario: id, idSede: id, nombreCompleto: z.string() })),
  categorias: z.array(z.object({ idCategoria: id, nombre: z.string() })) });
export const adminResultSchema = z.object({ actualizado: z.literal(true) });
export type AdminQuery = z.infer<typeof adminQuerySchema>;
export type UserEdit = z.infer<typeof userEditSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserForm = z.infer<typeof userFormSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminCatalog = z.infer<typeof adminCatalogSchema>;
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;
export type GroupInput = z.infer<typeof groupInputSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type Specialty = z.infer<typeof specialtySchema>;
