import { useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { useArticle, useKnowledgeCatalog } from './useKnowledge';
import { useKnowledgeFeedback } from './useKnowledgeFeedback';

export function useKnowledgeDetail() {
  const { idArticulo = '' } = useParams<{ idArticulo: string }>();
  const [editing, setEditing] = useState(false);
  const session = useAuth();
  const feedback = useKnowledgeFeedback(Number(idArticulo));
  return { query: useArticle(Number(idArticulo)), catalog: useKnowledgeCatalog(), editing, setEditing, feedback,
    canEdit: session.data?.usuario.permisos.includes('kb.editar') ?? false };
}
