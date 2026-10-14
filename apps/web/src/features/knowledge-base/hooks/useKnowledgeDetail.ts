import { useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { useArticle, useKnowledgeCatalog } from './useKnowledge';

export function useKnowledgeDetail() {
  const { idArticulo = '' } = useParams<{ idArticulo: string }>();
  const [editing, setEditing] = useState(false);
  const session = useAuth();
  return { query: useArticle(Number(idArticulo)), catalog: useKnowledgeCatalog(), editing, setEditing,
    canEdit: session.data?.usuario.permisos.includes('kb.editar') ?? false };
}
