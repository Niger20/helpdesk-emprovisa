import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchSession } from '../api/auth.api';
import { HttpError } from '../../../lib/http';

export const sessionKey = ['auth', 'sesion'] as const;
export function useSession() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: sessionKey, queryFn: async ({ signal }) => {
    try { return await fetchSession(signal); }
    catch (error) { if (error instanceof HttpError && error.status === 401) return null; throw error; }
  }, retry: false, staleTime: 0, refetchOnWindowFocus: true });
  const expiry = query.data?.expiraEn;
  useEffect(() => {
    if (!expiry) return;
    const timer = window.setTimeout(() => {
      client.removeQueries({ predicate: (cached) => cached.queryKey[0] !== 'auth' });
      client.setQueryData(sessionKey, null);
    }, Math.max(0, Date.parse(expiry) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [client, expiry]);
  return query;
}
