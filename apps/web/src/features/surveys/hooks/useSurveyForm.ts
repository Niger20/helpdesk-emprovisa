import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { surveyResponseSchema } from '@helpdesk/contracts';
import type { SurveyResponse } from '@helpdesk/contracts';
import { respondSurvey } from '../api/surveys.api';

export function useSurveyForm(token: string, csrfToken: string) {
  const form = useForm<SurveyResponse>({ resolver: zodResolver(surveyResponseSchema), mode: 'onBlur', defaultValues: { comentario: '' } });
  const mutation = useMutation({ mutationFn: (data: SurveyResponse) => respondSurvey(token, csrfToken, data), retry: false });
  return { form, submit: form.handleSubmit((data) => mutation.mutate(data)), pending: mutation.isPending,
    error: mutation.error?.message, receipt: mutation.data };
}
