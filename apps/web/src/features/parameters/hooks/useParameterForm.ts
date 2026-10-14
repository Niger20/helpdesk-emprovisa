import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterUpdateSchema, parameterValueSchema } from '@helpdesk/contracts';
import type { Parameter, ParameterUpdate } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { parametersKeys, saveParameter } from '../api/parameters.api';

export function useParameterForm(parameter: Parameter) {
  const auth = useAuth(); const client = useQueryClient();
  const schema = parameterUpdateSchema.extend({ valor: parameterValueSchema(parameter.clave) });
  const form = useForm<ParameterUpdate>({ resolver: zodResolver(schema), defaultValues: { valor: parameter.valor, valorAnterior: parameter.valor } });
  const mutation = useMutation({ mutationFn: (data: ParameterUpdate) => {
    if (!auth.data) throw new Error('Iniciá sesión para continuar.');
    return saveParameter(parameter.clave, data, auth.data.csrfToken);
  }, onSuccess: async (saved) => {
    form.reset({ valor: saved.valor, valorAnterior: saved.valor });
    await client.invalidateQueries({ queryKey: parametersKeys.all });
    await client.invalidateQueries({ queryKey: ['ticket-adjuntos'] });
  } });
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)), reload: () => { void client.invalidateQueries({ queryKey: parametersKeys.all }); } };
}
