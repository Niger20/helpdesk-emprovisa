import type { ReactNode } from 'react';
import { useSession } from '../../features/auth';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}
