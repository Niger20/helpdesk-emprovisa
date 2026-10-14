import { roleCatalogSchema, roleCatalogRoleSchema } from '@helpdesk/contracts';
import type { RoleCatalogInput, RoleCatalogRole } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

const path = '/api/v1/admin/catalogo-roles';
export const roleCatalogKeys = { all: ['admin', 'catalogo-roles'] as const };
export const fetchRoleCatalog = () => http(path, roleCatalogSchema);
export const saveRole = (data: RoleCatalogInput, before: RoleCatalogRole | null, csrfToken: string) => http(
  before ? `${path}/${before.idRol}` : path, roleCatalogRoleSchema, { method: before ? 'PUT' : 'POST',
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify(before ? { datos: data, anterior: { codigo: before.codigo, nombre: before.nombre,
      descripcion: before.descripcion, permisos: before.permisos } } : data) });
