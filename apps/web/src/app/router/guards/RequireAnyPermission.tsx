import type { ReactNode } from 'react';
import type { Permiso } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';

export function RequireAnyPermission({ permisos, children }: { permisos: Permiso[]; children: ReactNode }) {
  const session = useAuth().data;
  if (!permisos.some((permission) => session?.usuario.permisos.includes(permission))) return <p className="p-6">No tenés permiso para abrir esta sección.</p>;
  return children;
}
