import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema } from '@helpdesk/contracts';
import type { LoginRequest } from '@helpdesk/contracts';
import { useAuthActions } from './useAuthActions';

export function useLoginForm() {
  const { loginAction } = useAuthActions();
  const form = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema), mode: 'onBlur', defaultValues: { username: '', password: '' } });
  const submit = form.handleSubmit((values) => { loginAction.mutate(values); });
  return { form, submit, pending: loginAction.isPending, error: loginAction.error?.message };
}
