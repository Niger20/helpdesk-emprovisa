import { adminCatalogSchema, adminUserListSchema, adminUserSchema, groupsListSchema, groupSchema, membersListSchema,
  roleLinksSchema, rolesCatalogSchema, specialtiesListSchema } from '@helpdesk/contracts';
import type { UserForm, GroupInput, Membership, RoleAssignment, Specialty } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

const root = '/api/v1/admin';
const options = (method: string, csrfToken: string, input?: unknown): RequestInit => ({ method,
  headers: { 'X-CSRF-Token': csrfToken, ...(input === undefined ? {} : { 'Content-Type': 'application/json' }) },
  ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
export const fetchUsers = (page: number, q: string, signal: AbortSignal) => http(`${root}/usuarios?page=${page}&q=${encodeURIComponent(q)}`, adminUserListSchema, { signal });
export const fetchCatalog = (signal: AbortSignal, canUsers: boolean) => http(canUsers ? `${root}/catalogos` : `${root}/grupos/catalogos`, adminCatalogSchema, { signal });
export const fetchRoles = (signal: AbortSignal) => http(`${root}/roles`, rolesCatalogSchema, { signal });
export const fetchLinks = (id: number, signal: AbortSignal) => http(`${root}/usuarios/${id}/roles`, roleLinksSchema, { signal });
export const fetchGroups = (page: number, signal: AbortSignal) => http(`${root}/grupos?page=${page}`, groupsListSchema, { signal });
export const fetchMembers = (id: number, signal: AbortSignal) => http(`${root}/grupos/${id}/miembros`, membersListSchema, { signal });
export const fetchSpecialties = (id: number, signal: AbortSignal) => http(`${root}/usuarios/${id}/especialidades`, specialtiesListSchema, { signal });
export function saveUser(input: UserForm, csrf: string) {
  const { idUsuario, password, username, ...profile } = input;
  return idUsuario === null ? http(`${root}/usuarios`, adminUserSchema, options('POST', csrf, { ...profile, username, password }))
    : http(`${root}/usuarios/${idUsuario}`, adminUserSchema, options('PUT', csrf, profile));
}
export const setUserState = (id: number, activo: boolean, csrf: string) => http(`${root}/usuarios/${id}/estado`, adminUserSchema, options('PUT', csrf, { activo }));
export const unlockUser = (id: number, csrf: string) => http(`${root}/usuarios/${id}/desbloquear`, adminUserSchema, options('POST', csrf));
export const resetPassword = (id: number, password: string, csrf: string) => http(`${root}/usuarios/${id}/password`, adminUserSchema, options('PUT', csrf, { password }));
export const assignRole = (id: number, data: RoleAssignment, csrf: string) => http(`${root}/usuarios/${id}/roles`, roleLinksSchema, options('POST', csrf, data));
export const editRole = (id: number, link: number, data: RoleAssignment, csrf: string) => http(`${root}/usuarios/${id}/roles/${link}`, roleLinksSchema, options('PUT', csrf, data));
export const removeRole = (id: number, link: number, csrf: string) => http(`${root}/usuarios/${id}/roles/${link}`, roleLinksSchema, options('DELETE', csrf));
export const saveGroup = (id: number | null, data: GroupInput, csrf: string) => http(id === null ? `${root}/grupos` : `${root}/grupos/${id}`, groupSchema, options(id === null ? 'POST' : 'PUT', csrf, data));
export const saveMember = (id: number, data: Membership, csrf: string) => http(`${root}/grupos/${id}/miembros`, membersListSchema, options('PUT', csrf, data));
export const removeMember = (id: number, user: number, csrf: string) => http(`${root}/grupos/${id}/miembros/${user}`, membersListSchema, options('DELETE', csrf));
export const saveSpecialty = (id: number, data: Specialty, csrf: string) => http(`${root}/usuarios/${id}/especialidades`, specialtiesListSchema, options('PUT', csrf, data));
export const removeSpecialty = (id: number, category: number, csrf: string) => http(`${root}/usuarios/${id}/especialidades/${category}`, specialtiesListSchema, options('DELETE', csrf));
