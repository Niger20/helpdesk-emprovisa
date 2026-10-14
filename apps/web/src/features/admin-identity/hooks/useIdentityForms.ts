import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupInputSchema, membershipSchema, passwordResetSchema, roleAssignmentSchema, specialtySchema, userFormSchema } from '@helpdesk/contracts';
import type { AdminUser, GroupInput, Membership, RoleAssignment, Specialty, UserForm } from '@helpdesk/contracts';
import { useIdentityMutation } from './useIdentity';
import * as api from '../api/identity.api';

export function useUserForm(user: AdminUser | null, idSede: number) {
  const form = useForm<UserForm>({ resolver: zodResolver(userFormSchema), defaultValues: user ? { idUsuario: user.idUsuario, username: user.username,
    password: '', nombreCompleto: user.nombreCompleto, correo: user.correo, cargo: user.cargo, extension: user.extension,
    idSede: user.idSede, idDepartamento: user.idDepartamento, idJefeInmediato: user.idJefeInmediato } : {
    idUsuario: null, username: '', password: '', nombreCompleto: '', correo: '', cargo: null, extension: null, idSede,
    idDepartamento: null, idJefeInmediato: null } });
  const mutation = useIdentityMutation(api.saveUser);
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data, { onSuccess: () => {
    form.setValue('password', '');
    if (!user) form.reset();
  } })) };
}
export function useGroupForm(group: (GroupInput & { idGrupo: number }) | null) {
  const form = useForm<GroupInput>({ resolver: zodResolver(groupInputSchema), defaultValues: group ? { nombre: group.nombre, nivel: group.nivel,
    idSede: group.idSede, correoGrupo: group.correoGrupo, activo: group.activo } : { nombre: '', nivel: 1, idSede: null, correoGrupo: null, activo: true } });
  const mutation = useIdentityMutation((data: GroupInput, csrf) => api.saveGroup(group?.idGrupo ?? null, data, csrf));
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
export function useRoleForm(id: number) {
  const [idLink, setIdLink] = useState<number | null>(null);
  const form = useForm<RoleAssignment>({ resolver: zodResolver(roleAssignmentSchema), defaultValues: { idRol: 0, idSedeAlcance: null, vigenteDesde: '', vigenteHasta: null } });
  const mutation = useIdentityMutation((data: RoleAssignment, csrf) => idLink === null ? api.assignRole(id, data, csrf) : api.editRole(id, idLink, data, csrf));
  return { form, mutation, idLink, choose: (link: RoleAssignment & { idUsuarioRol: number }) => {
    setIdLink(link.idUsuarioRol); form.reset({ idRol: link.idRol, idSedeAlcance: link.idSedeAlcance, vigenteDesde: link.vigenteDesde, vigenteHasta: link.vigenteHasta });
  }, cancel: () => { setIdLink(null); form.reset({ idRol: 0, idSedeAlcance: null, vigenteDesde: '', vigenteHasta: null }); },
  submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
export function useMemberForm(id: number) {
  const form = useForm<Membership>({ resolver: zodResolver(membershipSchema), defaultValues: { idUsuario: 0, esCoordinador: false, desde: '', hasta: null } });
  const mutation = useIdentityMutation((data: Membership, csrf) => api.saveMember(id, data, csrf));
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
export function useSpecialtyForm(id: number) {
  const form = useForm<Specialty>({ resolver: zodResolver(specialtySchema), defaultValues: { idCategoria: 0, nivelDominio: 1 } });
  const mutation = useIdentityMutation((data: Specialty, csrf) => api.saveSpecialty(id, data, csrf));
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data)) };
}
export function usePasswordForm(id: number) {
  const form = useForm<{ password: string }>({ resolver: zodResolver(passwordResetSchema), defaultValues: { password: '' } });
  const mutation = useIdentityMutation((data: { password: string }, csrf) => api.resetPassword(id, data.password, csrf));
  return { form, mutation, submit: form.handleSubmit((data) => mutation.mutate(data, { onSuccess: () => form.reset() })) };
}
