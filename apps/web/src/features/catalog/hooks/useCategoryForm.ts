import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryInputSchema } from '@helpdesk/contracts';
import type { Category, CategoryInput } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { saveCategory } from '../api/catalog.api';

export function useCategoryForm(previous: Category | null, saved: (category: Category) => void) {
  const auth = useAuth(); const client = useQueryClient();
  const form = useForm<CategoryInput>({ resolver: zodResolver(categoryInputSchema), defaultValues: previous ? categoryInputSchema.strip().parse(previous)
    : { nombre: '', idPadre: null, tipoAplicable: 'INCIDENTE', requiereActivo: false, idGrupoDefault: null, orden: 0, activa: true } });
  const mutation = useMutation({ mutationFn: (data: CategoryInput) => {
    if (!auth.data) throw new Error('Iniciá sesión para continuar.');
    return saveCategory(previous, data, auth.data.csrfToken);
  }, onSuccess: async (category) => {
    await client.invalidateQueries({ queryKey: ['admin-categorias'] });
    await client.invalidateQueries({ queryKey: ['tickets'] });
    await client.invalidateQueries({ queryKey: ['tickets-options'] });
    await client.invalidateQueries({ queryKey: ['conocimientos'] });
    await client.invalidateQueries({ queryKey: ['admin-identity'] });
    saved(category);
  } });
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
