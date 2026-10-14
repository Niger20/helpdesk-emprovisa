import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { fetchTicket } from '../api/tickets.api';

export function useTicket() {
  const { numero = '' } = useParams();
  return useQuery({ queryKey: ['ticket', numero], queryFn: ({ signal }) => fetchTicket(numero, signal), retry: false });
}
