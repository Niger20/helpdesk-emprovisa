import { DateTime } from 'luxon';
import { AppError } from '../../common/errors/app-error.js';
import type { createIdentitySecurityRepository } from './identity-security.repository.js';

export function buildIdentitySecurityService(repository: ReturnType<typeof createIdentitySecurityRepository>) {
  return { ...repository, ensureAdministrator: async (now: Date) => {
    const today = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
    if (!(await repository.administrators(today, now)).length) throw new AppError('ENTRADA_INVALIDA', 409,
      'Debe conservarse al menos un administrador local global activo con vigencia indefinida.');
  } };
}
