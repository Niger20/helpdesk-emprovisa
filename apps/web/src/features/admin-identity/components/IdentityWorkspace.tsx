import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useIdentityWorkspace } from '../hooks/useIdentityWorkspace';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { UserAccessPanel } from './UserAccessPanel';
import { RolePanel } from './RolePanel';
import { SpecialtyPanel } from './SpecialtyPanel';
import { GroupForm } from './GroupForm';
import { MemberPanel } from './MemberPanel';
import { RoleWorkspace } from './RoleWorkspace';

export function IdentityWorkspace() {
  const state = useIdentityWorkspace();
  return <div className="space-y-5">
    <nav aria-label="Administración de identidad" className="flex flex-wrap gap-2 border-b border-border pb-3">
      {state.canUsers && <button type="button" aria-pressed={state.tab === 'users'} className="min-h-10 rounded border border-input px-4" onClick={() => state.setTab('users')}>Usuarios locales</button>}
      {state.canRoles && <button type="button" aria-pressed={state.tab === 'groups'} className="min-h-10 rounded border border-input px-4" onClick={() => state.setTab('groups')}>Grupos resolutores</button>}
    </nav>
    {state.tab === 'users' ? <>
      <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Buscar usuario<input type="search" value={state.q} onChange={(e) => { state.setQ(e.target.value); state.setPage(1); }} className="mt-1 block min-h-10 rounded border border-input bg-card px-3" /></label>
        <button type="button" className="min-h-10 rounded bg-primary px-4 text-primary-foreground" onClick={state.newUser}>Nuevo usuario</button></div>
      <QueryBoundary query={state.users} isEmpty={(data) => data.data.length === 0}>{(data) => <UserTable data={data.data} select={state.chooseUser} />}</QueryBoundary>
      {(state.creatingUser || state.user) && <QueryBoundary query={state.catalog} isEmpty={(data) => data.sedes.length === 0}>{(catalog) => <div className="space-y-5">
        <UserForm key={state.user?.idUsuario ?? 'nuevo'} user={state.user} catalog={catalog} idSede={state.session.data?.usuario.sede.idSede ?? 0} />
        {state.user && <UserAccessPanel key={`acceso-${state.user.idUsuario}`} user={state.user} />}
        {state.user && state.canRoles && <><RolePanel key={`roles-${state.user.idUsuario}`} id={state.user.idUsuario} catalog={catalog} />
          <SpecialtyPanel key={`especialidades-${state.user.idUsuario}`} id={state.user.idUsuario} catalog={catalog} /></>}
      </div>}</QueryBoundary>}
    </> : <>
      {!state.canUsers && <QueryBoundary query={state.catalog} isEmpty={(data) => data.usuarios.length === 0}>{(catalog) => <RoleWorkspace catalog={catalog} />}</QueryBoundary>}
      <button type="button" className="min-h-10 rounded bg-primary px-4 text-primary-foreground" onClick={state.newGroup}>Nuevo grupo</button>
      <QueryBoundary query={state.groups} isEmpty={(data) => data.data.length === 0}>{(data) => <ul className="grid gap-3 sm:grid-cols-2">{data.data.map((group) => <li key={group.idGrupo} className="rounded border border-border bg-card p-4">
        <button type="button" className="min-h-10 text-primary underline" onClick={() => state.chooseGroup(group)}>{group.nombre}</button>
        <p className="text-sm">Nivel {group.nivel} · {group.activo ? 'Activo' : 'Inactivo'}</p></li>)}</ul>}</QueryBoundary>
      {(state.creatingGroup || state.group) && <QueryBoundary query={state.catalog} isEmpty={(data) => data.sedes.length === 0}>{(catalog) => <div className="space-y-5">
        <GroupForm key={state.group?.idGrupo ?? 'nuevo-grupo'} group={state.group} catalog={catalog} />
        {state.group && <MemberPanel key={`miembros-${state.group.idGrupo}`} id={state.group.idGrupo} catalog={catalog} />}
      </div>}</QueryBoundary>}
    </>}
    <div className="flex flex-wrap items-center gap-3 text-sm"><button type="button" disabled={state.page <= 1} className="min-h-10 rounded border border-input px-3 disabled:opacity-50" onClick={() => state.setPage(state.page - 1)}>Anterior</button>
      <span>Página {state.page}</span><button type="button" disabled={state.page * 20 >= (state.tab === 'users' ? state.users.data?.meta.total ?? 0 : state.groups.data?.meta.total ?? 0)} className="min-h-10 rounded border border-input px-3 disabled:opacity-50" onClick={() => state.setPage(state.page + 1)}>Siguiente</button></div>
  </div>;
}
