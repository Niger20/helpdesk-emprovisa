import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNotifications, fetchAutomations, fetchInvitations } from '../api/notifications.api';
import { useAuth } from '../../../hooks/useAuth';

export function useNotifications() {
  const [page, setPage] = useState(1);
  const canAudit = useAuth().data?.usuario.permisos.includes('auditoria.ver') ?? false;
  const query = useQuery({ queryKey: ['notifications', page], queryFn: ({ signal }) => fetchNotifications(page, signal), refetchInterval: 30_000 });
  const tasks = useQuery({ queryKey: ['automation-status'], queryFn: ({ signal }) => fetchAutomations(signal), enabled: canAudit, refetchInterval: 30_000 });
  const invitations = useQuery({ queryKey: ['survey-invitations'], queryFn: ({ signal }) => fetchInvitations(signal), refetchInterval: 30_000 });
  return { page, setPage, canAudit, query, tasks, invitations };
}
