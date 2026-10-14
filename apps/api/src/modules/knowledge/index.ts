import type { Database } from '../../infra/db/client.js';
import { createKnowledgeRepository } from './knowledge.repository.js';
import { buildKnowledgeService } from './knowledge.service.js';
import { createFeedbackRepository } from './feedback.repository.js';
import { buildFeedbackService } from './feedback.service.js';

export const createKnowledgeService = (database: Database) => buildKnowledgeService(createKnowledgeRepository(database), buildFeedbackService(database, createFeedbackRepository(database)));
export { registerKnowledgeRoutes } from './knowledge.routes.js';
export type { KnowledgeService } from './knowledge.service.js';
export const createKnowledgeFeedbackService = (database: Database) => buildFeedbackService(database, createFeedbackRepository(database));
export { registerFeedbackRoutes } from './feedback.routes.js';
