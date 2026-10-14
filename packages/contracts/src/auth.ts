import { z } from 'zod';
import { permisoSchema } from './permissions.js';

export const loginRequestSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{1,50}$/, 'Ingresá un usuario válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.').max(256, 'La contraseña es demasiado larga.'),
}).strict();
export const csrfResponseSchema = z.object({ csrfToken: z.string().regex(/^[a-f0-9]{64}$/) });
export const usuarioSesionSchema = z.object({
  idUsuario: z.number().int(), username: z.string(), nombreCompleto: z.string(),
  sede: z.object({ idSede: z.number().int(), codigo: z.string(), nombre: z.string() }),
  roles: z.array(z.object({ codigo: z.string(), idSedeAlcance: z.number().int().nullable() })),
  permisos: z.array(permisoSchema),
});
export const sesionResponseSchema = z.object({
  usuario: usuarioSesionSchema, csrfToken: csrfResponseSchema.shape.csrfToken, expiraEn: z.iso.datetime(),
});
export const logoutResponseSchema = z.object({ mensaje: z.literal('Sesión cerrada.') });
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type UsuarioSesion = z.infer<typeof usuarioSesionSchema>;
export type SesionResponse = z.infer<typeof sesionResponseSchema>;
