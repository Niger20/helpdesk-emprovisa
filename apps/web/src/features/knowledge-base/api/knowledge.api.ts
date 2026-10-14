import { knowledgeListSchema, knowledgeDetailSchema, knowledgeCatalogSchema } from '@helpdesk/contracts';
import type { KnowledgeQuery, KnowledgeCreate, KnowledgeUpdate } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export function fetchKnowledge(query: KnowledgeQuery, signal: AbortSignal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
  return http(`/api/v1/conocimientos?${params}`, knowledgeListSchema, { signal });
}
export const fetchArticle = (id: number, signal: AbortSignal) => http(`/api/v1/conocimientos/${id}`, knowledgeDetailSchema, { signal });
export const fetchCatalog = (signal: AbortSignal) => http('/api/v1/conocimientos/catalogos', knowledgeCatalogSchema, { signal });
export const saveArticle = (data: KnowledgeCreate | KnowledgeUpdate, csrfToken: string, id?: number) =>
  http(`/api/v1/conocimientos${id ? `/${id}` : ''}`, knowledgeDetailSchema, { method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(data) });
