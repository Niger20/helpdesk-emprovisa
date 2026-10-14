import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import type { AdminCatalog, UserForm } from '@helpdesk/contracts';

export function useProfileOptions(form: UseFormReturn<UserForm>, catalog: AdminCatalog) {
  const idSede = useWatch({ control: form.control, name: 'idSede' });
  const idUsuario = useWatch({ control: form.control, name: 'idUsuario' });
  return { departamentos: catalog.departamentos.filter((d) => d.idSede === idSede),
    jefes: catalog.usuarios.filter((u) => u.idSede === idSede && u.idUsuario !== idUsuario) };
}
