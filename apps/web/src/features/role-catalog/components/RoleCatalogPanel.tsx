import { useState } from 'react';
import type { RoleCatalog, RoleCatalogRole } from '@helpdesk/contracts';
import { RoleForm } from './RoleForm';

export function RoleCatalogPanel({ catalog }: { catalog: RoleCatalog }) {
  const [selected, setSelected] = useState<RoleCatalogRole | null | undefined>();
  const [saved, setSaved] = useState(false);
  const current = selected ? catalog.roles.find((role) => role.idRol === selected.idRol) ?? selected : selected;
  return <div className="space-y-4">
    <button className="min-h-10 rounded bg-primary px-4 text-primary-foreground" onClick={() => { setSelected(null); setSaved(false); }}>Crear rol</button>
    {saved && <p role="status">Rol guardado.</p>}
    {current !== undefined && <RoleForm key={current ? JSON.stringify(current) : 'nuevo'} role={current} permissions={catalog.permisos}
      onSaved={() => { setSelected(undefined); setSaved(true); }} onCancel={() => setSelected(undefined)} />}
    <div className="grid gap-3 lg:grid-cols-2">{catalog.roles.map((role) => <article key={role.idRol} className="rounded border border-border bg-card p-4">
      <h2 className="font-semibold">{role.nombre}</h2><p className="break-all text-sm text-muted">{role.codigo} · {role.esSistema ? 'Sistema · solo lectura' : 'Personalizado'}</p>
      {role.descripcion && <p className="mt-2 text-sm">{role.descripcion}</p>}
      <details className="mt-3"><summary className="min-h-10 cursor-pointer">{role.permisos.length} permisos</summary>
        <ul className="space-y-1 text-sm">{role.permisos.map((code) => <li key={code} className="break-all">{code}</li>)}</ul>
      </details>
      {!role.esSistema && <button onClick={() => { setSelected(role); setSaved(false); }} className="min-h-10 rounded border border-input px-4" aria-label={`Editar rol ${role.nombre}`}>Editar</button>}
    </article>)}</div>
  </div>;
}
