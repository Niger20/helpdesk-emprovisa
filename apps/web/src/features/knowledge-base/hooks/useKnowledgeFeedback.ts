import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { knowledgeVoteSchema, knowledgeLinkSchema } from '@helpdesk/contracts';
import type { KnowledgeVote, KnowledgeLink } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { fetchFeedback, fetchLinks, saveVote, saveLink } from '../api/feedback.api';
import { knowledgeKeys } from '../api/knowledge.keys';

export function useKnowledgeFeedback(id: number) {
  const session = useAuth();
  const client = useQueryClient();
  const canVote = session.data?.usuario.permisos.includes('ticket.crear') ?? false;
  const canLink = session.data?.usuario.permisos.includes('ticket.atender') ?? false;
  const feedback = useQuery({ queryKey: [...knowledgeKeys.detail(id), 'utilidad'], queryFn: ({ signal }) => fetchFeedback(id, signal) });
  const links = useQuery({ queryKey: [...knowledgeKeys.detail(id), 'tickets'], queryFn: ({ signal }) => fetchLinks(id, signal) });
  const token = () => {
    if (!session.data) throw new Error('Iniciá sesión para continuar.');
    return session.data.csrfToken;
  };
  const refresh = () => client.invalidateQueries({ queryKey: knowledgeKeys.detail(id) });
  const voteForm = useForm<KnowledgeVote>({ resolver: zodResolver(knowledgeVoteSchema), values: feedback.data?.miVoto ?? { util: true, comentario: '' } });
  const linkForm = useForm<KnowledgeLink>({ resolver: zodResolver(knowledgeLinkSchema), defaultValues: { numero: '', uso: 'consulta' } });
  const vote = useMutation({ mutationFn: (data: KnowledgeVote) => saveVote(id, data, token()), onSuccess: refresh });
  const link = useMutation({ mutationFn: (data: KnowledgeLink) => saveLink(id, data, token()), onSuccess: async () => { linkForm.reset(); await refresh(); } });
  const unlink = useMutation({ mutationFn: (data: KnowledgeLink) => saveLink(id, data, token(), true), onSuccess: refresh });
  return { feedback, links, canVote, canLink, voteForm, linkForm, vote, link, unlink,
    submitVote: voteForm.handleSubmit((data) => vote.mutate(data)), submitLink: linkForm.handleSubmit((data) => link.mutate(data)) };
}
export type KnowledgeFeedbackState = ReturnType<typeof useKnowledgeFeedback>;
