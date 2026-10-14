import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function AssetSearchField({ form, options, required }: { form: UseFormReturn<TicketCreate>; options: TicketOptions['activos']; required: boolean }) {
  return <div><label htmlFor="ticket-activo" className="block text-sm font-semibold">Activo {required ? '(obligatorio)' : '(opcional)'}</label>
    <select id="ticket-activo" required={required} {...form.register('idActivo', { setValueAs: (value: string) => value ? Number(value) : null })} className="mt-1 min-h-11 w-full rounded border border-input px-3" aria-invalid={Boolean(form.formState.errors.idActivo)} aria-describedby="ticket-activo-error">
    <option value="">Seleccioná el código patrimonial</option>{options.map((item) => <option key={item.idActivo} value={item.idActivo}>{item.codigoPatrimonial}</option>)}
  </select><p id="ticket-activo-error" className="mt-1 text-sm text-danger">{form.formState.errors.idActivo?.message}</p></div>;
}
