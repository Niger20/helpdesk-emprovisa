import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import * as api from '../api/identity.api';
import { identityKeys } from '../api/identity.keys';

export function useIdentity() {
  const session = useAuth(); const [page, setPage] = useState(1); const [q, setQ] = useState('');
  const canUsers = session.data?.usuario.permisos.includes('usuario.administrar') ?? false;
  const canRoles = session.data?.usuario.permisos.includes('rol.administrar') ?? false;
  const users = useQuery({ queryKey: identityKeys.users(page, q), queryFn: ({ signal }) => api.fetchUsers(page, q, signal), enabled: canUsers });
  const groups = useQuery({ queryKey: identityKeys.groups(page), queryFn: ({ signal }) => api.fetchGroups(page, signal), enabled: canRoles });
  const catalog = useQuery({ queryKey: [...identityKeys.catalog, canUsers], queryFn: ({ signal }) => api.fetchCatalog(signal, canUsers), enabled: canUsers || canRoles });
  return { session, page, setPage, q, setQ, users, groups, catalog, canUsers, canRoles };
}
export function useIdentityMutation<T>(action: (input: T, csrf: string) => Promise<unknown>) {
  const session = useAuth(); const client = useQueryClient();
  return useMutation({ mutationFn: (input: T) => {
    if (!session.data) throw new Error('Iniciá sesión para continuar.'); return action(input, session.data.csrfToken);
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: identityKeys.all }); } });
}
export const useRoles = () => useQuery({ queryKey: identityKeys.roles, queryFn: ({ signal }) => api.fetchRoles(signal) });
export const useRoleLinks = (id: number) => useQuery({ queryKey: identityKeys.links(id), queryFn: ({ signal }) => api.fetchLinks(id, signal) });
export const useMembers = (id: number) => useQuery({ queryKey: identityKeys.members(id), queryFn: ({ signal }) => api.fetchMembers(id, signal) });
export const useSpecialties = (id: number) => useQuery({ queryKey: identityKeys.specialties(id), queryFn: ({ signal }) => api.fetchSpecialties(id, signal) });
