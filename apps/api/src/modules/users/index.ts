import type { Database } from '../../infra/db/client.js';
import { createUsersRepository } from './users.repository.js';
import { buildUsersService } from './users.service.js';
import { createIdentitySecurityRepository } from './identity-security.repository.js';
import type { IdentityExecutor } from './identity-security.repository.js';
import { buildIdentitySecurityService } from './identity-security.service.js';

export const createUsersService = (database: Database) => buildUsersService(createUsersRepository(database));
export const createIdentitySecurityService = (executor: IdentityExecutor) => buildIdentitySecurityService(createIdentitySecurityRepository(executor));
export { registerUsersRoutes } from './users.routes.js';
export { assertIdentitySede, identityScope, protectSelf, assertDelegable } from './users.policies.js';
export type { UsersService } from './users.service.js';
