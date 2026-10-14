import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketLifecycleSchema } from '@helpdesk/contracts';
import type { TicketLifecycleCommand, TicketLifecycleAction, TicketLifecycleOptions } from '@helpdesk/contracts';
import { initialLifecycleCommand } from '../lib/lifecycle';

export function useLifecycleForm(action: TicketLifecycleAction, options: TicketLifecycleOptions, send: (data: TicketLifecycleCommand) => void) {
  const form = useForm<TicketLifecycleCommand>({ resolver: zodResolver(ticketLifecycleSchema), mode: 'onBlur', defaultValues: initialLifecycleCommand(action, options) });
  return { form, submit: form.handleSubmit(send) };
}
