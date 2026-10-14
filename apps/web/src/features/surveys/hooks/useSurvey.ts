import { useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { surveyTokenSchema } from '@helpdesk/contracts';
import { loadSurvey } from '../api/surveys.api';

export function useSurvey() {
  const location = useLocation();
  const parsed = surveyTokenSchema.safeParse(location.hash.slice(1));
  const token = parsed.success ? parsed.data : '';
  const query = useQuery({ queryKey: ['surveys', token], queryFn: () => token ? loadSurvey(token) : Promise.resolve(null),
    retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false });
  return { token, query };
}
