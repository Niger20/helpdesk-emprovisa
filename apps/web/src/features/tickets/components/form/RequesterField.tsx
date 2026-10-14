import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function RequesterField({ form, options, thirdParty }: { form: UseFormReturn<TicketCreate>; options: TicketOptions['solicitantes']; thirdParty: boolean }) {
  return <div className="space-y-4"><label className="block text-sm font-semibold">Solicitante<select {...form.register('idSolicitante', { valueAsNumber: true })} className="mt-1 min-h-11 w-full rounded border border-input px-3">{options.map((item) => <option key={item.idUsuario} value={item.idUsuario}>{item.nombreCompleto}</option>)}</select></label>
    {thirdParty && <label className="block text-sm font-semibold">Canal alterno<select {...form.register('canalIngreso')} className="mt-1 min-h-11 w-full rounded border border-input px-3"><option value="PORTAL">Seleccioná el canal</option><option value="TELEFONO">Teléfono</option><option value="PRESENCIAL">Presencial</option></select></label>}
  </div>;
}
