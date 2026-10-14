import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import type { TicketLifecycleCommand, TicketLifecycleOptions } from '@helpdesk/contracts';
import { LifecycleTextField } from './LifecycleTextField';

export function EscalationFields({ form, options }: { form: UseFormReturn<TicketLifecycleCommand>; options: TicketLifecycleOptions }) {
  const selected = useWatch({ control: form.control, name: 'idGrupoDestino' });
  const members = options.grupos.find((group) => group.idGrupo === selected)?.integrantes ?? [];
  const field = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  return <div className="space-y-4">
    <label className="block text-sm">Grupo destino<select className={field} {...form.register('idGrupoDestino', { valueAsNumber: true, onChange: () => form.setValue('idUsuarioDestino', null) })}>
      <option value={0}>Seleccioná un grupo de nivel 2</option>{options.grupos.map((group) => <option key={group.idGrupo} value={group.idGrupo}>{group.nombre}</option>)}</select></label>
    <label className="block text-sm">Especialista<select className={field} {...form.register('idUsuarioDestino', { setValueAs: (value: string) => value ? Number(value) : null })}>
      <option value="">Cola del grupo, sin responsable individual</option>{members.map((member) => <option key={member.idUsuario} value={member.idUsuario}>{member.nombreCompleto}</option>)}</select></label>
    <LifecycleTextField form={form} name="motivo" label="Motivo del escalamiento" maxLength={200} multiline />
  </div>;
}
