import type { UseFormReturn } from 'react-hook-form';
import { tipoTicketSchema, impactoSchema, urgenciaSchema } from '@helpdesk/contracts';
import type { TicketCreate } from '@helpdesk/contracts';

export function TicketFields({ form }: { form: UseFormReturn<TicketCreate> }) {
  const fieldClass = 'mt-1 min-h-11 w-full rounded border border-input bg-card px-3 py-2';
  return <div className="space-y-4">
    <label className="block text-sm font-semibold">Tipo<select {...form.register('tipo')} className={fieldClass}>{tipoTicketSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label>
    <div><label htmlFor="ticket-titulo" className="block text-sm font-semibold">Título</label>
      <input id="ticket-titulo" {...form.register('titulo')} className={fieldClass} maxLength={150} aria-invalid={Boolean(form.formState.errors.titulo)} aria-describedby="ticket-titulo-error" />
      <p id="ticket-titulo-error" className="mt-1 text-sm text-danger">{form.formState.errors.titulo?.message}</p></div>
    <div><label htmlFor="ticket-descripcion" className="block text-sm font-semibold">Descripción</label>
      <textarea id="ticket-descripcion" {...form.register('descripcion')} className={`${fieldClass} min-h-32`} maxLength={8000} aria-invalid={Boolean(form.formState.errors.descripcion)} aria-describedby="ticket-descripcion-error" />
      <p id="ticket-descripcion-error" className="mt-1 text-sm text-danger">{form.formState.errors.descripcion?.message}</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Impacto<select {...form.register('impacto')} className={fieldClass}>{impactoSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="block text-sm font-semibold">Urgencia<select {...form.register('urgencia')} className={fieldClass}>{urgenciaSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label></div>
  </div>;
}
