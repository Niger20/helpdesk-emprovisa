import type { KnowledgeCatalog, KnowledgeDetail } from '@helpdesk/contracts';
import { estadoArticuloSchema, visibilidadArticuloSchema } from '@helpdesk/contracts';
import { useKnowledgeForm } from '../hooks/useKnowledgeForm';

interface Props { catalog: KnowledgeCatalog; article?: KnowledgeDetail; onCancel: () => void }
export function KnowledgeForm({ catalog, article, onCancel }: Props) {
  const { form, submit, pending, error } = useKnowledgeForm(article, onCancel);
  const { register, formState: { errors } } = form;
  const field = 'min-h-10 w-full rounded border border-border bg-background px-3';
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-5" aria-label={article ? 'Editar artículo' : 'Nuevo artículo'}>
    <h2 className="text-lg font-semibold">{article ? 'Editar artículo' : 'Nuevo artículo'}</h2>
    <p className="text-sm text-muted">Cada guardado conserva una versión. Los borradores no aparecen en autoservicio.</p>
    <label className="block space-y-1 text-sm font-semibold">Título<input {...register('titulo')} maxLength={150} className={field} aria-invalid={!!errors.titulo} /></label>
    <label className="block space-y-1 text-sm font-semibold">Resumen<input {...register('resumen')} maxLength={300} className={field} /></label>
    <label className="block space-y-1 text-sm font-semibold">Categoría<select {...register('idCategoria', { valueAsNumber: true })} className={field}>
      <option value={0}>Seleccioná una categoría</option>{catalog.categorias.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombre}</option>)}
    </select></label>
    <label className="block space-y-1 text-sm font-semibold">Contenido (texto plano)<textarea {...register('contenido')} rows={10} maxLength={100000} className={`${field} py-2`} aria-invalid={!!errors.contenido} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-semibold">Estado<select {...register('estado')} className={field}>
      {estadoArticuloSchema.options.map((state) => <option key={state}>{state}</option>)}</select></label>
      <label className="space-y-1 text-sm font-semibold">Visibilidad<select {...register('visibilidad')} className={field}>
        {visibilidadArticuloSchema.options.map((visibility) => <option key={visibility}>{visibility}</option>)}</select></label></div>
    <label className="block space-y-1 text-sm font-semibold">Motivo del cambio<input {...register('motivoCambio')} maxLength={200} className={field} aria-invalid={!!errors.motivoCambio} /></label>
    {Object.keys(errors).length > 0 && <div role="alert" className="text-sm text-danger">{Object.entries(errors).map(([name, issue]) => <p key={name}>{issue.message}</p>)}</div>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar artículo'}</button>
      <button type="button" onClick={onCancel} disabled={pending} className="min-h-10 rounded border border-border px-4">Cancelar</button></div>
  </form>;
}
