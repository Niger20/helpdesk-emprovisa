export const loadKnowledgeListPage = () => import('./pages/KnowledgeListPage').then((module) => ({ default: module.KnowledgeListPage }));
export const loadKnowledgeDetailPage = () => import('./pages/KnowledgeDetailPage').then((module) => ({ default: module.KnowledgeDetailPage }));
