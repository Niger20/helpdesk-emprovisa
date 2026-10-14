import { randomUUID } from 'node:crypto';
import { csrfToken, newToken, tokenHash } from '../../common/crypto/session-tokens.js';
import type { AuthRepository } from './auth.repository.js';
import type { SessionsRepository } from './sessions.repository.js';
import { mapProfile, mapGrants } from './auth.mapper.js';
import { assertPermission } from './auth.policies.js';
import type { LoginMetadata, SessionContext } from './auth.types.js';

export function createSessionsService(repository: SessionsRepository, auth: AuthRepository, secret: string) {
  return {
    create: async (idUsuario: number, metadata: LoginMetadata, now: Date) => {
      const profile = await repository.profile(idUsuario, now);
      if (!profile) return null;
      const idleMinutes = await auth.parameter('sesion.inactividad_minutos', 30);
      const token = newToken();
      const context: SessionContext = { idSesion: randomUUID(), usuario: mapProfile(profile),
        grants: mapGrants(profile),
        csrfToken: csrfToken(secret, token), expiraEn: new Date(now.getTime() + idleMinutes * 60_000), idleMinutes };
      if (!context.usuario.permisos.includes('auth.sesion')) return null;
      await repository.insert(context.idSesion, idUsuario, tokenHash(token), metadata, now, context.expiraEn);
      return { token, context };
    },
    load: async (token: string, now: Date) => {
      if (!/^[a-f0-9]{64}$/.test(token)) return null;
      const session = await repository.find(tokenHash(token));
      if (!session || session.revocadaEn || session.expiraEn <= now) return null;
      const profile = await repository.profile(session.idUsuario, now);
      if (!profile || !profile.permissions.some((permission) => permission.codigo === 'auth.sesion')) {
        await repository.revoke(session.idSesion, now, 'USUARIO_SIN_ACCESO');
        return null;
      }
      const idleMinutes = await auth.parameter('sesion.inactividad_minutos', 30);
      if (session.ultimaActividad.getTime() + idleMinutes * 60_000 <= now.getTime()) return null;
      const expiraEn = new Date(now.getTime() + idleMinutes * 60_000);
      if (!await repository.touch(session.idSesion, now, expiraEn)) return null;
      return { idSesion: session.idSesion, usuario: mapProfile(profile), grants: mapGrants(profile), csrfToken: csrfToken(secret, token), expiraEn, idleMinutes };
    },
    me: (context: SessionContext | null) => { assertPermission(context, 'auth.sesion'); return context; },
    logout: async (context: SessionContext | null, now: Date) => {
      assertPermission(context, 'auth.sesion');
      if (context) await repository.revoke(context.idSesion, now, 'LOGOUT');
    },
  };
}
export type SessionsService = ReturnType<typeof createSessionsService>;
