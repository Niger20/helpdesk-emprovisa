import { useState } from 'react';
import { knowledgeQuerySchema } from '@helpdesk/contracts';
import type { KnowledgeQuery } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { useKnowledge, useKnowledgeCatalog } from './useKnowledge';

export function useKnowledgeList() {
  const [filters, setFilters] = useState<KnowledgeQuery>(knowledgeQuerySchema.parse({}));
  const [showForm, setShowForm] = useState(false);
  const session = useAuth();
  const changeFilters = (next: Partial<KnowledgeQuery>) => setFilters((previous) => ({ ...previous, ...next, page: next.page ?? 1 }));
  return { filters, changeFilters, showForm, setShowForm, query: useKnowledge(filters), catalog: useKnowledgeCatalog(),
    canEdit: session.data?.usuario.permisos.includes('kb.editar') ?? false };
}
