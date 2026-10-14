import { motivoPausaSchema } from '@helpdesk/contracts';
import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { UseFormReturn } from 'react-hook-form';
import { LifecycleTextField } from './LifecycleTextField';

export function PauseFields({ form }: { form: UseFormReturn<TicketLifecycleCommand> }) {
  return <div className="space-y-4"><label className="block text-sm">Motivo de espera<select className="mt-1 min-h-10 w-full rounded border border-input bg-card px-3" {...form.register('motivo')}>
    {motivoPausaSchema.options.map((reason) => <option key={reason} value={reason}>{reason === 'REPUESTOS' ? 'Espera de repuestos' : 'Proveedor externo'}</option>)}</select></label>
    <LifecycleTextField form={form} name="detalle" label="Detalle de la espera" maxLength={250} multiline />
    <LifecycleTextField form={form} name="referenciaExterna" label="Referencia externa (opcional)" maxLength={60} nullable />
  </div>;
}
