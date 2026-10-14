import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { knowledgeUpdateSchema } from '@helpdesk/contracts';
import type { KnowledgeDetail, KnowledgeUpdate } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { saveArticle } from '../api/knowledge.api';
import { knowledgeKeys } from '../api/knowledge.keys';

export function useKnowledgeForm(article: KnowledgeDetail | undefined, onSaved: () => void) {
  const session = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<KnowledgeUpdate>({ resolver: zodResolver(knowledgeUpdateSchema), mode: 'onBlur', defaultValues: {
    titulo: article?.titulo ?? '', resumen: article?.resumen ?? '', contenido: article?.contenido ?? '',
    idCategoria: article?.idCategoria ?? 0, estado: article?.estado ?? 'BORRADOR', visibilidad: article?.visibilidad ?? 'PUBLICO',
    motivoCambio: '', versionActual: article?.versionActual ?? 1,
  } });
  const mutation = useMutation({ mutationFn: (data: KnowledgeUpdate) => {
    if (!session.data) throw new Error('Iniciá sesión para guardar el artículo.');
    return saveArticle(data, session.data.csrfToken, article?.idArticulo);
  }, onSuccess: async (saved) => {
    await client.invalidateQueries({ queryKey: knowledgeKeys.all });
    onSaved();
    void navigate(`/conocimientos/${saved.idArticulo}`);
  } });
  return { form, submit: form.handleSubmit((data) => mutation.mutate(data)), pending: mutation.isPending, error: mutation.error?.message };
}
