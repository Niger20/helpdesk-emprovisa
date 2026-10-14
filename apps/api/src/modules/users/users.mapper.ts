import { adminUserSchema } from '@helpdesk/contracts';
import type { UsersRepository } from './users.repository.js';

export function mapAdminUser(row: NonNullable<Awaited<ReturnType<UsersRepository['find']>>>) {
  return adminUserSchema.parse({ idUsuario: row.idUsuario, username: row.username, nombreCompleto: row.nombreCompleto,
    correo: row.correo, cargo: row.cargo, extension: row.extension, idSede: row.idSede, idDepartamento: row.idDepartamento,
    idJefeInmediato: row.idJefeInmediato, origenCuenta: row.origenCuenta, estado: row.estado, sedeNombre: row.sedeNombre,
    bloqueadoHasta: row.bloqueadoHasta?.toISOString() ?? null, intentosFallidos: row.intentosFallidos });
}
