import { usuarioSesionSchema, permisoSchema } from '@helpdesk/contracts';
import type { SessionsRepository } from './sessions.repository.js';

export function mapProfile(profile: NonNullable<Awaited<ReturnType<SessionsRepository['profile']>>>) {
  return usuarioSesionSchema.parse({
    idUsuario: profile.user.idUsuario, username: profile.user.username, nombreCompleto: profile.user.nombreCompleto,
    sede: { idSede: profile.user.idSede, codigo: profile.user.codigo, nombre: profile.user.nombre },
    roles: profile.roles.map((role) => ({ codigo: role.codigo, idSedeAlcance: role.idSedeAlcance })),
    permisos: [...new Set(profile.permissions.map((permission) => permission.codigo))],
  });
}

export function mapGrants(profile: NonNullable<Awaited<ReturnType<SessionsRepository['profile']>>>) {
  return profile.permissions.flatMap((permission) => profile.roles.filter((role) => role.idRol === permission.idRol)
    .map((role) => ({ codigo: permisoSchema.parse(permission.codigo), idSedeAlcance: role.idSedeAlcance })));
}
