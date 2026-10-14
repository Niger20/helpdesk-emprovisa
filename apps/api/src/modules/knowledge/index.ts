import type { Database } from '../../infra/db/client.js';
import { createKnowledgeRepository } from './knowledge.repository.js';
import { buildKnowledgeService } from './knowledge.service.js';

export const createKnowledgeService = (database: Database) => buildKnowledgeService(createKnowledgeRepository(database));
export { registerKnowledgeRoutes } from './knowledge.routes.js';
export type { KnowledgeService } from './knowledge.service.js';
