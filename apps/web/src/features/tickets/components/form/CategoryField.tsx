import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function CategoryField({ form, options }: { form: UseFormReturn<TicketCreate>; options: TicketOptions['categorias'] }) {
  return <div><label htmlFor="ticket-categoria" className="block text-sm font-semibold">Categoría</label>
    <select id="ticket-categoria" {...form.register('idCategoria', { valueAsNumber: true })} className="mt-1 min-h-11 w-full rounded border border-input px-3" aria-invalid={Boolean(form.formState.errors.idCategoria)} aria-describedby="ticket-categoria-error">
    <option value={0}>Seleccioná una categoría</option>{options.map((item) => <option key={item.idCategoria} value={item.idCategoria}>{item.nombre}</option>)}
  </select><p id="ticket-categoria-error" className="mt-1 text-sm text-danger">{form.formState.errors.idCategoria?.message}</p></div>;
}
