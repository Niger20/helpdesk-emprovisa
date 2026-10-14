import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function CategoryField({ form, options }: { form: UseFormReturn<TicketCreate>; options: TicketOptions['categorias'] }) {
  return <label className="block text-sm font-semibold">Categoría<select {...form.register('idCategoria', { valueAsNumber: true })} className="mt-1 min-h-11 w-full rounded border border-input px-3" aria-invalid={Boolean(form.formState.errors.idCategoria)}>
    <option value={0}>Seleccioná una categoría</option>{options.map((item) => <option key={item.idCategoria} value={item.idCategoria}>{item.nombre}</option>)}
  </select><span className="mt-1 block text-sm text-danger">{form.formState.errors.idCategoria?.message}</span></label>;
}
