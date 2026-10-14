import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function AssetSearchField({ form, options, required }: { form: UseFormReturn<TicketCreate>; options: TicketOptions['activos']; required: boolean }) {
  return <label className="block text-sm font-semibold">Activo {required ? '(obligatorio)' : '(opcional)'}<select required={required} {...form.register('idActivo', { setValueAs: (value: string) => value ? Number(value) : null })} className="mt-1 min-h-11 w-full rounded border border-input px-3">
    <option value="">Seleccioná el código patrimonial</option>{options.map((item) => <option key={item.idActivo} value={item.idActivo}>{item.codigoPatrimonial}</option>)}
  </select></label>;
}
