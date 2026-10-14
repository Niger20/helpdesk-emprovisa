import type { Parameter } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';
import { useParameterForm } from '../hooks/useParameterForm';

export function ParameterForm({ parameter }: { parameter: Parameter }) {
  const { form, mutation, submit, reload } = useParameterForm(parameter);
  const id = `parameter-${parameter.clave}`;
  return <form onSubmit={(event) => { void submit(event); }} className="space-y-3 rounded border border-border bg-card p-4">
    <h2 className="font-semibold">{parameter.nombre}</h2>
    <p className="text-sm text-muted" id={`${id}-description`}>{parameter.descripcion}</p>
    <label className="block" htmlFor={id}>Valor en {parameter.unidad}</label>
    <input id={id} type="number" min={parameter.minimo} max={parameter.maximo} step={1} required readOnly={!parameter.editable}
      aria-describedby={`${id}-description ${id}-limits`} aria-invalid={Boolean(form.formState.errors.valor)}
      className="min-h-10 w-full rounded border border-input bg-background px-3 sm:max-w-xs" {...form.register('valor', { valueAsNumber: true })} />
    <p className="text-sm text-muted" id={`${id}-limits`}>{parameter.editable ? `Permitido: ${parameter.minimo}–${parameter.maximo} ${parameter.unidad}.` : 'Solo consulta.'}</p>
    <p className="text-sm text-muted">{parameter.origen === 'PREDETERMINADO' ? 'Valor predeterminado del servicio.' : `Última modificación: ${parameter.modificadoEn ? formatDate(parameter.modificadoEn) : 'Sin fecha'}`}</p>
    {form.formState.errors.valor && <p role="alert" className="text-danger">Ingresá un número entero dentro del rango permitido.</p>}
    {mutation.isError && <div role="alert" className="space-y-2 text-danger"><p>{mutation.error.message}</p>
      <button type="button" onClick={reload} className="min-h-10 rounded border border-input px-4 text-foreground">Recargar parámetros</button></div>}
    {mutation.isSuccess && <p role="status">Parámetro guardado.</p>}
    {parameter.editable && <button disabled={mutation.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{mutation.isPending ? 'Guardando…' : 'Guardar parámetro'}</button>}
  </form>;
}
