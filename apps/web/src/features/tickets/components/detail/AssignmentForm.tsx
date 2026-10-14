import type { TicketAssign, TicketOperation } from '@helpdesk/contracts';
import { useAssignmentForm } from '../../hooks/useAssignmentForm';

interface Props { operation: TicketOperation; pending: boolean; assign: (data: TicketAssign) => void }
export function AssignmentForm({ operation, pending, assign }: Props) {
  const { form, submit } = useAssignmentForm(operation.version, assign);
  return <form noValidate className="mt-4 space-y-3" onSubmit={(event) => { void submit(event); }}><fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
    <legend className="sr-only">Asignar responsable</legend>
    <label className="text-sm" htmlFor="asignacion-usuario">Responsable<select id="asignacion-usuario" className="mt-1 min-h-10 w-full rounded border border-input bg-card px-3"
      {...form.register('idUsuario', { valueAsNumber: true })} aria-invalid={Boolean(form.formState.errors.idUsuario)} aria-describedby="asignacion-usuario-error">
      <option value="0">Seleccioná un integrante del grupo</option>{operation.candidatos.map((candidate) => <option key={candidate.idUsuario} value={candidate.idUsuario}>{candidate.nombreCompleto}</option>)}</select>
      <span className="text-danger" id="asignacion-usuario-error">{form.formState.errors.idUsuario?.message}</span></label>
    <label className="text-sm" htmlFor="asignacion-motivo">Motivo<input id="asignacion-motivo" className="mt-1 min-h-10 w-full rounded border border-input px-3" maxLength={200} {...form.register('motivo')}
      aria-invalid={Boolean(form.formState.errors.motivo)} aria-describedby="asignacion-motivo-error" />
      <span className="text-danger" id="asignacion-motivo-error">{form.formState.errors.motivo?.message}</span></label>
  </fieldset><button disabled={pending} type="submit" className="min-h-10 rounded border border-input px-4 disabled:opacity-50">Guardar asignación</button></form>;
}
