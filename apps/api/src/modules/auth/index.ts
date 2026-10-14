import type { Database } from '../../infra/db/client.js';
import { createAuthRepository } from './auth.repository.js';
import { buildAuthService } from './auth.service.js';

export const createAuthService = (database: Database, secret: string) => buildAuthService(createAuthRepository(database), secret);
export { registerAuthRoutes } from './auth.routes.js';
export type { AuthService } from './auth.service.js';
export type { SessionContext } from './auth.types.js';
