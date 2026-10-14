import type { Category, CategoryCatalog } from '@helpdesk/contracts';
import { useCategoryForm } from '../hooks/useCategoryForm';

export function CategoryForm({ selected, catalog, saved }: { selected: Category | null; catalog: CategoryCatalog; saved: (category: Category) => void }) {
  const { form, mutation, submit } = useCategoryForm(selected, saved);
  const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <form className="space-y-4 rounded border border-border bg-card p-4 text-sm" onSubmit={(event) => { void submit(event); }}>
    <h2 className="text-lg font-semibold">{selected ? 'Editar categoría' : 'Nueva categoría'}</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label>Nombre *<input className={field} maxLength={80} required {...form.register('nombre')} /></label>
      <label>Tipo de requerimiento<select className={field} {...form.register('tipoAplicable')}><option value="INCIDENTE">Incidente</option><option value="SOLICITUD">Solicitud</option><option value="AMBOS">Ambos</option></select></label>
      <label>Categoría superior<select className={field} {...form.register('idPadre', { setValueAs: (value: string) => value ? Number(value) : null })}><option value="">Sin categoría superior</option>
        {catalog.categorias.filter((category) => category.idCategoria !== selected?.idCategoria).map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombre}{category.activa ? '' : ' (inactiva)'}</option>)}</select></label>
      <label>Grupo responsable por defecto<select className={field} {...form.register('idGrupoDefault', { setValueAs: (value: string) => value ? Number(value) : null })}><option value="">Sin asignación por categoría</option>
        {selected?.idGrupoDefault && !catalog.grupos.some((group) => group.idGrupo === selected.idGrupoDefault) && <option value={selected.idGrupoDefault}>{selected.grupoDefault} (inactivo; seleccioná otro)</option>}
        {catalog.grupos.map((group) => <option key={group.idGrupo} value={group.idGrupo}>{group.nombre} · Nivel {group.nivel} · {group.sede ?? 'Todas las sedes'}</option>)}</select></label>
      <label>Orden de presentación<input className={field} type="number" min={0} max={32767} required {...form.register('orden', { valueAsNumber: true })} /></label>
      <div><label className="flex min-h-10 items-center gap-2"><input type="checkbox" {...form.register('requiereActivo')} />Exige activo de inventario</label>
        <label className="flex min-h-10 items-center gap-2"><input type="checkbox" {...form.register('activa')} />Categoría activa</label></div>
    </div>
    <p className="text-muted">Las categorías con tickets conservan su tipo y requisito de activo. Para cambiarlos, creá otra categoría.</p>
    {Object.keys(form.formState.errors).length > 0 && <p role="alert" className="text-danger">Revisá los campos obligatorios y sus límites.</p>}
    {mutation.isError && <p role="alert" className="text-danger">{mutation.error.message}</p>}
    {mutation.isSuccess && <p role="status">Categoría guardada.</p>}
    <button className="min-h-10 rounded bg-primary px-4 text-white disabled:opacity-50" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : 'Guardar categoría'}</button>
  </form>;
}
