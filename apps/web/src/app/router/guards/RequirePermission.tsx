import type { ReactNode } from 'react';
import type { Permiso } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';

export function RequirePermission({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const session = useAuth().data;
  if (!session?.usuario.permisos.includes(permiso)) return <p role="alert" className="p-6 text-danger">No tenés permiso para consultar esta sección.</p>;
  return children;
}
