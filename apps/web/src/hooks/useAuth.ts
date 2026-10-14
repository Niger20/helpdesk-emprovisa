import { useContext } from 'react';
import { AuthContext } from '../app/providers/authContext';

export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('Falta el proveedor de sesión.');
  return session;
}
