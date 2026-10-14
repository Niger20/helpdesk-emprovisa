import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { login, logout } from '../api/auth.api';
import { sessionKey } from './useSession';

export function useAuthActions() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const loginAction = useMutation({ mutationFn: login, onSuccess: (session) => {
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    client.setQueryData(sessionKey, session); void navigate('/');
  } });
  const logoutAction = useMutation({ mutationFn: logout, onSuccess: () => {
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    client.setQueryData(sessionKey, null); void navigate('/login');
  } });
  return { loginAction, logoutAction };
}
