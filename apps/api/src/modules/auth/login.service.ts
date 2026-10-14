import { verify } from 'argon2';
import { loginRequestSchema } from '@helpdesk/contracts';
import type { LoginRequest } from '@helpdesk/contracts';
import { AppError } from '../../common/errors/app-error.js';
import type { AuthRepository } from './auth.repository.js';
import type { LoginMetadata } from './auth.types.js';
import { createSessionsService } from './sessions.service.js';

export function createLoginService(repository: AuthRepository, secret: string, dummyHash: string) {
  return async (input: LoginRequest, metadata: LoginMetadata, now: Date) => {
    const data = loginRequestSchema.parse(input);
    const snapshot = await repository.findUser(data.username);
    const validPassword = await verify(snapshot?.passwordHash ?? dummyHash, data.password).catch(() => false);
    const result = await repository.atomic(data.username, async (locked) => {
      const user = await locked.findUser(data.username);
      const attempts = await locked.recentAttempts(data.username, new Date(now.getTime() - 15 * 60_000));
      let reason: string | null = attempts >= 10 ? 'LIMITE_USUARIO'
        : user?.bloqueadoHasta && user.bloqueadoHasta > now ? 'BLOQUEADO'
          : !user || !validPassword || user.passwordHash !== snapshot?.passwordHash || user.origenCuenta !== 'LOCAL'
            ? 'CREDENCIALES_INVALIDAS' : user.estado !== 'ACTIVO' ? 'INACTIVO' : null;
      if (reason === 'CREDENCIALES_INVALIDAS' && user) {
        const failures = (user.bloqueadoHasta && user.bloqueadoHasta <= now ? 0 : user.intentosFallidos) + 1;
        const blockMinutes = await locked.parameter('login.bloqueo_minutos', 15);
        await locked.updateFailures(user.idUsuario, Math.min(failures, 5), failures >= 5 ? new Date(now.getTime() + blockMinutes * 60_000) : null);
      }
      const session = !reason && user ? await createSessionsService(locked.sessions, locked, secret).create(user.idUsuario, metadata, now) : null;
      if (!reason && !session) reason = 'SIN_ACCESO';
      if (session && user) await locked.successfulAccess(user.idUsuario, now);
      await locked.attempt(data.username, user?.idUsuario ?? null, Boolean(session), reason, metadata, now);
      return { session, limited: reason === 'LIMITE_USUARIO' };
    });
    if (result.limited) throw new AppError('LIMITE_EXCEDIDO', 429, 'Demasiados intentos. Esperá unos minutos antes de intentar nuevamente.');
    if (!result.session) throw new AppError('CREDENCIALES_INVALIDAS', 401, 'Usuario o contraseña incorrectos, o cuenta sin acceso.');
    return result.session;
  };
}
