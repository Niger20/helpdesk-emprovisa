import { useQuery } from '@tanstack/react-query';
import { fetchParameters, parametersKeys } from '../api/parameters.api';

export function useParameters() {
  return useQuery({ queryKey: parametersKeys.all, queryFn: fetchParameters });
}
