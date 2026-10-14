import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { fetchTickets } from '../api/tickets.api';

export function useTickets() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({ queryKey: ['tickets', params.toString()], queryFn: ({ signal }) => fetchTickets(params.toString(), signal) });
  const changeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };
  return { query, params, changeFilter };
}
