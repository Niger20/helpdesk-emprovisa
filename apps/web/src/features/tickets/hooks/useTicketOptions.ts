import { useQuery } from '@tanstack/react-query';
import { fetchTicketOptions } from '../api/tickets.api';

export function useTicketOptions() {
  return useQuery({ queryKey: ['tickets-options'], queryFn: ({ signal }) => fetchTicketOptions(signal) });
}
