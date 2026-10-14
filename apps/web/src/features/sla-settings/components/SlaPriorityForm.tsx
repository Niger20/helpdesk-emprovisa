import type { SlaPriority } from '@helpdesk/contracts';
import { useSlaPriorityForm } from '../hooks/useSlaPriorityForm';

export function SlaPriorityForm({ priority, revision }: { priority: SlaPriority; revision: string }) {
  const { form, mutation, submit, reload } = useSlaPriorityForm(priority, revision);
  const id = `sla-${priority.codigo}`;
  return <form noValidate onSubmit={(event) => { void submit(event); }} className="space-y-3 rounded border border-border bg-card p-4">
    <h3 className="font-semibold">{priority.codigo} · {priority.nombre}</h3>
    <p>{priority.cumpleNormativa ? 'Cumple la norma' : 'Requiere revisión de configuración'} · {priority.activa ? 'Activa' : 'Inactiva'}</p>
    <dl className="grid grid-cols-2 gap-2 text-sm">
      <dt>Respuesta</dt><dd>{priority.minutosRespuesta} minutos</dd>
      <dt>Solución</dt><dd>{priority.minutosSolucion} minutos</dd>
      <dt>Calendario</dt><dd>{priority.modoCalendario === 'CONTINUO' ? 'Continuo (24 horas)' : 'Horario laboral'}</dd>
      <dt>Alerta temprana</dt><dd>{priority.porcentajeAlerta}%</dd>
    </dl>
    {!priority.cumpleNormativa && <p role="alert" className="text-sm text-danger">Norma: respuesta {priority.normativa.minutosRespuesta} min; solución {priority.normativa.minutosSolucion} min;
      calendario {priority.normativa.modoCalendario}; alerta {priority.normativa.porcentajeAlerta}%.</p>}
    <label htmlFor={id} className="block">Nombre de presentación</label>
    <input id={id} maxLength={30} required aria-invalid={Boolean(form.formState.errors.nombre)} aria-describedby={`${id}-help${form.formState.errors.nombre ? ` ${id}-error` : ''}`}
      className="min-h-10 w-full rounded border border-input bg-background px-3" {...form.register('nombre')} />
    <p id={`${id}-help`} className="text-sm text-muted">Solo se edita el nombre. El código, la matriz y los plazos se conservan.</p>
    {form.formState.errors.nombre && <p id={`${id}-error`} role="alert" className="text-danger">{form.formState.errors.nombre.message}</p>}
    {mutation.isError && <div role="alert"><p className="text-danger">{mutation.error.message}</p>
      <button type="button" onClick={reload} className="min-h-10 rounded border border-input px-4">Recargar configuración</button></div>}
    <button disabled={mutation.isPending} className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{mutation.isPending ? 'Guardando…' : 'Guardar nombre'}</button>
  </form>;
}
