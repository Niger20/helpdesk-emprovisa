import { hash } from 'argon2';
import { randomBytes } from 'node:crypto';
import type { AuthRepository } from './auth.repository.js';
import { createLoginService } from './login.service.js';
import { createSessionsService } from './sessions.service.js';
import { assertPermission } from './auth.policies.js';
import type { LoginMetadata } from './auth.types.js';

export async function buildAuthService(repository: AuthRepository, secret: string) {
  const dummyHash = await hash(randomBytes(32));
  const sessions = createSessionsService(repository.sessions, repository, secret);
  return {
    login: createLoginService(repository, secret, dummyHash),
    load: sessions.load, me: sessions.me, logout: sessions.logout,
    assertPermission,
    recordRejectedAttempt: async (username: string, reason: string, metadata: LoginMetadata, now: Date) => {
      const safeUsername = /^[a-z0-9._-]{1,50}$/.test(username) ? username : '<invalido>';
      const user = await repository.findUser(safeUsername);
      await repository.attempt(safeUsername, user?.idUsuario ?? null, false, reason.slice(0, 40), metadata, now);
    },
  };
}
export type AuthService = Awaited<ReturnType<typeof buildAuthService>>;
