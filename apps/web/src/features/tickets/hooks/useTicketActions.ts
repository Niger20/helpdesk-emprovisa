import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { assignTicket, attendTicket, commentTicket, fetchTicketOperation } from '../api/ticket-actions.api';
import type { TicketAssign, TicketComment } from '@helpdesk/contracts';

export function useTicketActions(numero: string) {
  const session = useAuth().data;
  const client = useQueryClient();
  const operation = useQuery({ queryKey: ['ticket-operacion', numero], queryFn: ({ signal }) => fetchTicketOperation(numero, signal) });
  const refresh = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['ticket', numero] }), client.invalidateQueries({ queryKey: ['ticket-operacion', numero] }),
      client.invalidateQueries({ queryKey: ['tickets'] }), client.invalidateQueries({ queryKey: ['activos'] }), client.invalidateQueries({ queryKey: ['ticket-ciclo', numero] })]);
  };
  const assign = useMutation({ mutationFn: (data: TicketAssign) => assignTicket(numero, data, session?.csrfToken ?? ''), onSuccess: refresh });
  const attend = useMutation({ mutationFn: (version: number) => attendTicket(numero, version, session?.csrfToken ?? ''), onSuccess: refresh });
  const comment = useMutation({ mutationFn: (data: TicketComment) => commentTicket(numero, data, session?.csrfToken ?? ''), onSuccess: refresh });
  return { operation, assign, attend, comment, refresh, userId: session?.usuario.idUsuario ?? 0,
    pending: assign.isPending || attend.isPending || comment.isPending };
}
