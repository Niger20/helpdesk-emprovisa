import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Calendar } from '@helpdesk/contracts';
import { fetchCalendars, fetchCalendarSites } from '../api/calendars.api';

export function useCalendars() {
  const [page, setPage] = useState(1); const [selected, select] = useState<Calendar | null>(null); const [notice, setNotice] = useState('');
  const list = useQuery({ queryKey: ['calendarios', 'lista', page], queryFn: ({ signal }) => fetchCalendars(page, signal) });
  const sites = useQuery({ queryKey: ['calendarios', 'sedes'], queryFn: ({ signal }) => fetchCalendarSites(signal) });
  return { page, setPage, selected, list, sites, notice,
    select: (calendar: Calendar | null) => { select(calendar); setNotice(''); },
    saved: (calendar: Calendar) => { select(calendar); setNotice('Calendario guardado. Los ciclos anteriores conservan sus horarios y feriados.'); } };
}
