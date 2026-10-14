import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleCatalogInputSchema } from '@helpdesk/contracts';
import type { RoleCatalogInput, RoleCatalogRole } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { roleCatalogKeys, saveRole } from '../api/role-catalog.api';

export function useRoleForm(role: RoleCatalogRole | null, onSaved: () => void) {
  const auth = useAuth(); const client = useQueryClient();
  const form = useForm<RoleCatalogInput>({ resolver: zodResolver(roleCatalogInputSchema), defaultValues: role ? {
    codigo: role.codigo, nombre: role.nombre, descripcion: role.descripcion, permisos: role.permisos,
  } : { codigo: '', nombre: '', descripcion: null, permisos: ['auth.sesion'] } });
  const mutation = useMutation({ mutationFn: (data: RoleCatalogInput) => {
    if (!auth.data) throw new Error('Iniciá sesión para continuar.');
    return saveRole(data, role, auth.data.csrfToken);
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: roleCatalogKeys.all });
    await client.invalidateQueries({ queryKey: ['admin', 'roles'] }); onSaved(); } });
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)),
    reload: () => { void client.invalidateQueries({ queryKey: roleCatalogKeys.all }); } };
}
