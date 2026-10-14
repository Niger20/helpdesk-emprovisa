import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { bindCalendar } from '../api/calendars.api';

export function useCalendarBinding(id: number) {
  const [selected, select] = useState(''); const auth = useAuth(); const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (site: { idSede: number; idCalendario: number }) => {
    if (!auth.data) throw new Error('Iniciá sesión para continuar.'); return bindCalendar(id, site, auth.data.csrfToken);
  }, onSuccess: async () => { select(''); await client.invalidateQueries({ queryKey: ['calendarios'] }); } });
  return { selected, select, mutation };
}
