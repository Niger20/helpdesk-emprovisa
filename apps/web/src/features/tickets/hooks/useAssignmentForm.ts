import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketAssignSchema } from '@helpdesk/contracts';
import type { TicketAssign } from '@helpdesk/contracts';

export function useAssignmentForm(version: number, assign: (data: TicketAssign) => void) {
  const form = useForm<TicketAssign>({ resolver: zodResolver(ticketAssignSchema), defaultValues: { idUsuario: 0, motivo: '', version }, mode: 'onBlur' });
  return { form, submit: form.handleSubmit((data) => assign({ ...data, version })) };
}
