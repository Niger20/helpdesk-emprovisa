import { useQuery } from '@tanstack/react-query';
import type { KnowledgeQuery } from '@helpdesk/contracts';
import { fetchKnowledge, fetchArticle, fetchCatalog } from '../api/knowledge.api';
import { knowledgeKeys } from '../api/knowledge.keys';

export const useKnowledge = (query: KnowledgeQuery) => useQuery({ queryKey: knowledgeKeys.list(query), queryFn: ({ signal }) => fetchKnowledge(query, signal) });
export const useArticle = (id: number) => useQuery({ queryKey: knowledgeKeys.detail(id), queryFn: ({ signal }) => fetchArticle(id, signal) });
export const useKnowledgeCatalog = () => useQuery({ queryKey: knowledgeKeys.catalog, queryFn: ({ signal }) => fetchCatalog(signal) });
