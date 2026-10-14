import { knowledgeFeedbackSchema, knowledgeFeedbackResultSchema, knowledgeLinksSchema } from '@helpdesk/contracts';
import type { KnowledgeVote, KnowledgeLink } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchFeedback = (id: number, signal: AbortSignal) => http(`/api/v1/conocimientos/${id}/utilidad`, knowledgeFeedbackSchema, { signal });
export const fetchLinks = (id: number, signal: AbortSignal) => http(`/api/v1/conocimientos/${id}/tickets`, knowledgeLinksSchema, { signal });
export const saveVote = (id: number, input: KnowledgeVote, token: string) => http(`/api/v1/conocimientos/${id}/utilidad`, knowledgeFeedbackResultSchema,
  { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-csrf-token': token }, body: JSON.stringify(input) });
export const saveLink = (id: number, input: KnowledgeLink, token: string, remove = false) => http(`/api/v1/conocimientos/${id}/tickets${remove ? `/${input.numero}` : ''}`,
  knowledgeFeedbackResultSchema, { method: remove ? 'DELETE' : 'PUT', headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
    ...(remove ? {} : { body: JSON.stringify(input) }) });
