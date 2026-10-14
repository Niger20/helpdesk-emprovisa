import { sql } from 'kysely';
import type { Selectable, Transaction } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { LoginMetadata } from './auth.types.js';
import { createSessionsRepository } from './sessions.repository.js';
import type { SessionsRepository } from './sessions.repository.js';

type Executor = Database | Transaction<DB>;
export type AuthUser = Selectable<DB['usuarios']>;

export interface AuthRepository {
  sessions: SessionsRepository;
  findUser: (username: string) => Promise<AuthUser | undefined>;
  atomic: <T>(username: string, action: (repository: AuthRepository) => Promise<T>) => Promise<T>;
  parameter: (key: string, fallback: number) => Promise<number>;
  recentAttempts: (username: string, since: Date) => Promise<number>;
  attempt: (username: string, userId: number | null, success: boolean, reason: string | null, metadata: LoginMetadata, now: Date) => Promise<void>;
  updateFailures: (userId: number, failures: number, lockedUntil: Date | null) => Promise<void>;
  successfulAccess: (userId: number, now: Date) => Promise<void>;
}

export function createAuthRepository(database: Database, executor: Executor = database): AuthRepository {
  return {
    sessions: createSessionsRepository(executor),
    findUser: (username) => executor.selectFrom('usuarios').selectAll().where('username', '=', username).executeTakeFirst(),
    atomic: (username, action) => database.transaction().execute(async (trx) => {
      await sql`select pg_advisory_xact_lock(2026003, hashtext(${username}))`.execute(trx);
      return action(createAuthRepository(database, trx));
    }),
    parameter: async (key, fallback) => {
      const parameter = await executor.selectFrom('parametros').select('valor').where('clave', '=', key).executeTakeFirst();
      const value = Number(parameter?.valor);
      return Number.isInteger(value) && value > 0 && value <= 1440 ? value : fallback;
    },
    recentAttempts: async (username, since) => {
      const row = await executor.selectFrom('intentosLogin').select((eb) => eb.fn.countAll().as('total'))
        .where('usernameIntentado', '=', username).where('fechaHora', '>=', since).executeTakeFirstOrThrow();
      return Number(row.total);
    },
    attempt: async (username, userId, success, reason, metadata, now) => {
      await executor.insertInto('intentosLogin').values({ usernameIntentado: username, idUsuario: userId,
        exitoso: success, motivoFallo: reason, direccionIp: metadata.direccionIp, fechaHora: now }).execute();
    },
    updateFailures: async (userId, failures, lockedUntil) => {
      await executor.updateTable('usuarios').set({ intentosFallidos: failures, bloqueadoHasta: lockedUntil }).where('idUsuario', '=', userId).execute();
    },
    successfulAccess: async (userId, now) => {
      await executor.updateTable('usuarios').set({ ultimoAcceso: now, intentosFallidos: 0, bloqueadoHasta: null }).where('idUsuario', '=', userId).execute();
    },
  };
}
