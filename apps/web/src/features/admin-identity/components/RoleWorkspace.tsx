import type { AdminCatalog } from '@helpdesk/contracts';
import { useRoleWorkspace } from '../hooks/useRoleWorkspace';
import { RolePanel } from './RolePanel';
import { SpecialtyPanel } from './SpecialtyPanel';

export function RoleWorkspace({ catalog }: { catalog: AdminCatalog }) {
  const { id, select } = useRoleWorkspace();
  return <div className="space-y-4"><h2 className="text-lg font-semibold">Roles y especialidades de usuarios</h2>
    <label className="block text-sm">Seleccioná usuario<select value={id} onChange={(event) => select(event.target.value)} className="mt-1 min-h-10 w-full rounded border border-input bg-card px-3">
      <option value={0}>Seleccioná un usuario activo</option>{catalog.usuarios.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombreCompleto}</option>)}
    </select></label>
    {id > 0 && <><RolePanel key={`rol-${id}`} id={id} catalog={catalog} /><SpecialtyPanel key={`especialidad-${id}`} id={id} catalog={catalog} /></>}
  </div>;
}
