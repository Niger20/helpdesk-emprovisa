import { roleCatalogSchema } from '@helpdesk/contracts';
import type { RoleCatalogRepository } from './role-catalog.repository.js';

export async function mapCatalog(repo: Pick<RoleCatalogRepository, 'roles' | 'permissions' | 'grants'>) {
  const [roles, permissions, grants] = await Promise.all([repo.roles(), repo.permissions(), repo.grants()]);
  return roleCatalogSchema.parse({ roles: roles.map((role) => ({ ...role,
    permisos: grants.filter((grant) => grant.idRol === role.idRol).map((grant) => grant.codigo).sort() })), permisos: permissions });
}
