import { useQuery } from '@tanstack/react-query';
import { fetchSlaSettings, slaSettingsKeys } from '../api/sla-settings.api';

export function useSlaSettings() {
  return useQuery({ queryKey: slaSettingsKeys.all, queryFn: fetchSlaSettings });
}
