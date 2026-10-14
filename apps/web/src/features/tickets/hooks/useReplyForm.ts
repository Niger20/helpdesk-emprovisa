import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketCommentSchema } from '@helpdesk/contracts';
import type { TicketComment } from '@helpdesk/contracts';

export function useReplyForm(version: number, send: (data: TicketComment, onSuccess: () => void) => void) {
  const form = useForm<TicketComment>({ resolver: zodResolver(ticketCommentSchema), defaultValues: { contenido: '', visibilidad: 'PUBLICO', version }, mode: 'onBlur' });
  const submit = form.handleSubmit((data) => send({ ...data, version }, () => form.reset({ contenido: '', visibilidad: data.visibilidad, version })));
  return { form, submit };
}
