import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health.api';

export function useHealth() {
  return useQuery({ queryKey: ['sistema', 'disponibilidad'], queryFn: ({ signal }) => fetchHealth(signal) });
}
