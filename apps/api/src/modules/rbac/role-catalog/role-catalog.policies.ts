import type { RoleCatalogRole, RoleCatalogUpdate } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { assertIdentitySede } from '../../users/index.js';
import { AppError } from '../../../common/errors/app-error.js';

export function requireCatalogActor(context: SessionContext | null): asserts context is SessionContext {
  assertIdentitySede(context, 'rol.administrar', null);
}
export function assertUnchanged(role: RoleCatalogRole, anterior: RoleCatalogUpdate['anterior']) {
  if (role.esSistema) throw new AppError('NO_AUTORIZADO', 403, 'Los roles del sistema son inmutables.');
  if (role.codigo !== anterior.codigo || role.nombre !== anterior.nombre || role.descripcion !== anterior.descripcion
    || JSON.stringify([...role.permisos].sort()) !== JSON.stringify([...anterior.permisos].sort())) {
    throw new AppError('ENTRADA_INVALIDA', 409, 'El rol cambió. Recargá el catálogo antes de guardar.');
  }
}
