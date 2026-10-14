import type { KnowledgeQuery } from '@helpdesk/contracts';

export const knowledgeKeys = { all: ['conocimientos'] as const, catalog: ['conocimientos', 'catalogos'] as const,
  list: (query: KnowledgeQuery) => ['conocimientos', 'lista', query] as const,
  detail: (id: number) => ['conocimientos', 'ficha', id] as const };
