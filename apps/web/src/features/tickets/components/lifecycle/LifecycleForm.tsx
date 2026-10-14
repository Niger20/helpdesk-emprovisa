import type { TicketLifecycleCommand, TicketLifecycleAction, TicketLifecycleOptions } from '@helpdesk/contracts';
import { useLifecycleForm } from '../../hooks/useLifecycleForm';
import { lifecycleLabels } from '../../lib/lifecycle';
import { ReclassificationFields } from './ReclassificationFields';
import { EscalationFields } from './EscalationFields';
import { PauseFields } from './PauseFields';
import { LifecycleTextField } from './LifecycleTextField';

interface Props { action: TicketLifecycleAction; options: TicketLifecycleOptions; pending: boolean; send: (data: TicketLifecycleCommand) => void; onCancel: () => void; error: string | undefined }
export function LifecycleForm({ action, options, pending, send, onCancel, error }: Props) {
  const { form, submit } = useLifecycleForm(action, options, send);
  return <form className="mt-5 space-y-4" noValidate onSubmit={(event) => { void submit(event); }} aria-label={lifecycleLabels[action]}>
    <h3 className="font-semibold">{lifecycleLabels[action]}</h3>
    <fieldset disabled={pending}><legend className="sr-only">Datos de la acción</legend>
      {action === 'reclasificar' ? <ReclassificationFields form={form} options={options} /> : action === 'escalar' ? <EscalationFields form={form} options={options} /> :
        action === 'pausar' ? <PauseFields form={form} /> : action === 'resolver' ? <div className="space-y-4">
          <LifecycleTextField form={form} name="causa" label="Causa (opcional)" maxLength={100} nullable />
          <LifecycleTextField form={form} name="solucion" label="Solución aplicada (visible para el solicitante)" maxLength={8000} multiline /></div> :
        action === 'cerrar' ? <label className="flex min-h-10 items-center gap-3 text-sm"><input type="checkbox" {...form.register('confirmacion')} />Confirmo que la solución fue satisfactoria.</label> :
          <LifecycleTextField form={form} name="motivo" label="Motivo" maxLength={200} multiline />}
    </fieldset>
    {Object.values(form.formState.errors).length > 0 && <p role="alert" className="text-sm text-danger">Completá los campos obligatorios y revisá las selecciones.</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={pending} type="submit" className="min-h-10 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : lifecycleLabels[action]}</button>
      <button disabled={pending} type="button" onClick={onCancel} className="min-h-10 rounded border border-input px-4">Volver</button></div>
  </form>;
}
