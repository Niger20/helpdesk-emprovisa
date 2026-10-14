import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { slaPriorityUpdateSchema } from '@helpdesk/contracts';
import type { SlaPriority, SlaPriorityUpdate } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { slaSettingsKeys, saveSlaPriority } from '../api/sla-settings.api';

export function useSlaPriorityForm(priority: SlaPriority, revision: string) {
  const auth = useAuth(); const client = useQueryClient();
  const form = useForm<SlaPriorityUpdate>({ resolver: zodResolver(slaPriorityUpdateSchema), defaultValues: { nombre: priority.nombre, revisionAnterior: revision } });
  const mutation = useMutation({ mutationFn: (data: SlaPriorityUpdate) => {
    if (!auth.data) throw new Error('Iniciá sesión para continuar.');
    return saveSlaPriority(priority.codigo, data, auth.data.csrfToken);
  }, onSuccess: (saved) => { client.setQueryData(slaSettingsKeys.all, saved); } });
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)), reload: () => { void client.invalidateQueries({ queryKey: slaSettingsKeys.all }); } };
}
