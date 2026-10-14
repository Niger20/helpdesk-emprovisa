import type { UseFormReturn } from 'react-hook-form';
import type { AdminCatalog, UserForm } from '@helpdesk/contracts';
import { useProfileOptions } from '../hooks/useProfileOptions';

interface Props { form: UseFormReturn<UserForm>; catalog: AdminCatalog }
export function UserProfileFields({ form, catalog }: Props) {
  const inputClass = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  const { departamentos, jefes } = useProfileOptions(form, catalog);
  return <div className="grid gap-4 sm:grid-cols-2">
    <label>Nombre completo *<input className={inputClass} {...form.register('nombreCompleto')} maxLength={100} required /></label>
    <label>Correo ficticio *<input type="email" className={inputClass} {...form.register('correo')} maxLength={120} required /></label>
    <label>Cargo<input className={inputClass} {...form.register('cargo', { setValueAs: (v: string) => v || null })} maxLength={80} /></label>
    <label>Extensión<input className={inputClass} {...form.register('extension', { setValueAs: (v: string) => v || null })} maxLength={10} /></label>
    <label>Sede *<select className={inputClass} {...form.register('idSede', { valueAsNumber: true })} required>
      <option value="">Seleccioná sede</option>{catalog.sedes.map((s) => <option key={s.idSede} value={s.idSede}>{s.nombre}</option>)}
    </select></label>
    <label>Departamento<select className={inputClass} {...form.register('idDepartamento', { setValueAs: (v: string) => v ? Number(v) : null })}>
      <option value="">Sin departamento</option>{departamentos.map((d) => <option key={d.idDepartamento} value={d.idDepartamento}>{d.nombre}</option>)}
    </select></label>
    <label>Jefe inmediato<select className={inputClass} {...form.register('idJefeInmediato', { setValueAs: (v: string) => v ? Number(v) : null })}>
      <option value="">Sin jefe inmediato</option>{jefes.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombreCompleto}</option>)}
    </select></label>
  </div>;
}
