import { impactoSchema, urgenciaSchema, prioridadSchema } from '@helpdesk/contracts';
import type { TicketLifecycleCommand, TicketLifecycleOptions } from '@helpdesk/contracts';
import type { UseFormReturn } from 'react-hook-form';
import { LifecycleTextField } from './LifecycleTextField';

export function ReclassificationFields({ form, options }: { form: UseFormReturn<TicketLifecycleCommand>; options: TicketLifecycleOptions }) {
  const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Categoría<select className={field} {...form.register('idCategoria', { valueAsNumber: true })}>
      {options.categorias.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombre}</option>)}</select></label>
    <label className="text-sm">Activo<select className={field} {...form.register('idActivo', { setValueAs: (value: string) => value ? Number(value) : null })}>
      <option value="">Sin activo</option>{options.activos.map((asset) => <option key={asset.idActivo} value={asset.idActivo}>{asset.codigoPatrimonial}</option>)}</select></label>
    <label className="text-sm">Impacto<select className={field} {...form.register('impacto')}>{impactoSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="text-sm">Urgencia<select className={field} {...form.register('urgencia')}>{urgenciaSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="text-sm">Prioridad manual<select className={field} {...form.register('prioridad', { setValueAs: (value: string) => value || null })}>
      <option value="">Calcular con la matriz</option>{prioridadSchema.options.map((item) => <option key={item}>{item}</option>)}</select></label>
    <LifecycleTextField form={form} name="justificacionPrioridad" label="Justificación del cambio" maxLength={200} />
  </div>;
}
