import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { TicketLifecycleCommand, TicketLifecycleAction } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { fetchLifecycle, executeLifecycle } from '../api/ticket-lifecycle.api';

export function useTicketLifecycle(numero: string) {
  const session = useAuth().data;
  const client = useQueryClient();
  const [selected, select] = useState<TicketLifecycleAction | null>(null);
  const query = useQuery({ queryKey: ['ticket-ciclo', numero], queryFn: ({ signal }) => fetchLifecycle(numero, signal) });
  const refresh = () => Promise.all(['ticket', 'ticket-operacion', 'ticket-ciclo', 'tickets', 'activos'].map((key) => client.invalidateQueries({ queryKey: [key] })));
  const mutation = useMutation({ mutationFn: (data: TicketLifecycleCommand) => executeLifecycle(numero, data, session?.csrfToken ?? ''),
    onSuccess: async () => { select(null); await refresh(); } });
  return { query, selected, select, mutation, refresh };
}
