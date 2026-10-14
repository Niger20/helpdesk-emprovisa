import { adminCatalogSchema, adminQuerySchema, groupInputSchema, groupSchema, membershipSchema, membersListSchema, specialtySchema, specialtiesListSchema } from '@helpdesk/contracts';
import type { AdminQuery, GroupInput, Membership, Specialty } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { assertIdentitySede, identityScope, protectSelf } from '../users/index.js';
import { AppError } from '../../common/errors/app-error.js';
import type { GroupsRepository } from './groups.repository.js';

export function buildGroupsService(repository: GroupsRepository) {
  const requireGroup = async (repo: Pick<GroupsRepository, 'find'>, context: SessionContext | null, id: number) => {
    identityScope(context, 'rol.administrar'); const row = await repo.find(id);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el grupo.');
    assertIdentitySede(context, 'rol.administrar', row.idSede); return row;
  };
  const requireUser = async (repo: Pick<GroupsRepository, 'user'>, context: SessionContext | null, id: number) => {
    identityScope(context, 'rol.administrar'); const row = await repo.user(id);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el usuario.');
    assertIdentitySede(context, 'rol.administrar', row.idSede); return row;
  };
  const detail = async (context: SessionContext | null, id: number) => groupSchema.parse(await requireGroup(repository, context, id));
  const members = async (context: SessionContext | null, id: number) => {
    await requireGroup(repository, context, id); const scope = identityScope(context, 'rol.administrar');
    return membersListSchema.parse((await repository.members(id)).filter((m) => !scope || scope.includes(m.idSede)));
  };
  const specialties = async (context: SessionContext | null, id: number) => { await requireUser(repository, context, id); return specialtiesListSchema.parse(await repository.specialties(id)); };
  const save = async (context: SessionContext | null, id: number | null, input: GroupInput, now = new Date()) => {
    const data = groupInputSchema.parse(input); assertIdentitySede(context, 'rol.administrar', data.idSede);
    if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
    const result = await repository.atomic(async (repo) => {
      if (id !== null) await requireGroup(repo, context, id);
      if (data.idSede !== null && !(await repo.site(data.idSede))) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná una sede activa con calendario.');
      if (id !== null) {
        const rows = await repo.members(id);
        for (const member of rows) {
          protectSelf(context, member.idUsuario);
          assertIdentitySede(context, 'rol.administrar', member.idSede);
          if (data.idSede !== null && member.idSede !== data.idSede) throw new AppError('ENTRADA_INVALIDA', 409, 'Retirá los miembros de otras sedes antes de cambiar la sede del grupo.');
          await repo.security.revoke(member.idUsuario, now);
        }
        await repo.edit(id, data);
      }
      const idGrupo = id ?? (await repo.insert(data)).idGrupo;
      await repo.security.audit(context, id === null ? 'GRUPO_CREADO' : 'GRUPO_EDITADO', 'grupos_resolutores', idGrupo,
        { nombre: data.nombre, nivel: data.nivel, idSede: data.idSede, activo: data.activo }, now);
      return idGrupo;
    });
    return detail(context, result);
  };
  return {
    detail, members, specialties,
    catalogs: async (context: SessionContext | null) => adminCatalogSchema.parse(await repository.catalogs(identityScope(context, 'rol.administrar'))),
    create: (context: SessionContext | null, input: GroupInput) => save(context, null, input),
    edit: (context: SessionContext | null, id: number, input: GroupInput) => save(context, id, input),
    list: async (context: SessionContext | null, input: AdminQuery) => {
      const scope = identityScope(context, 'rol.administrar'); const query = adminQuerySchema.parse(input);
      const { rows, total } = await repository.list(query, scope);
      return { data: rows.map((row) => groupSchema.parse(row)), meta: { page: query.page, pageSize: query.pageSize, total } };
    },
    member: async (context: SessionContext | null, id: number, input: Membership, now = new Date()) => {
      const data = membershipSchema.parse(input); identityScope(context, 'rol.administrar');
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, data.idUsuario);
      await repository.atomic(async (repo) => {
        const group = await requireGroup(repo, context, id); const user = await requireUser(repo, context, data.idUsuario);
        if (!group.activo || user.estado !== 'ACTIVO' || (group.idSede !== null && group.idSede !== user.idSede)) {
          throw new AppError('ENTRADA_INVALIDA', 400, 'El miembro debe estar activo y pertenecer a la sede del grupo activo.');
        }
        await repo.member(id, data); await repo.security.revoke(data.idUsuario, now);
        await repo.security.audit(context, 'GRUPO_MIEMBRO_GUARDADO', 'grupo_miembros', id, data, now);
      }); return members(context, id);
    },
    removeMember: async (context: SessionContext | null, id: number, idUsuario: number, now = new Date()) => {
      identityScope(context, 'rol.administrar');
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, idUsuario);
      await repository.atomic(async (repo) => {
        await requireGroup(repo, context, id); await requireUser(repo, context, idUsuario);
        await repo.removeMember(id, idUsuario); await repo.security.revoke(idUsuario, now);
        await repo.security.audit(context, 'GRUPO_MIEMBRO_RETIRADO', 'grupo_miembros', id, { idUsuario }, now);
      }); return members(context, id);
    },
    specialty: async (context: SessionContext | null, id: number, input: Specialty, now = new Date()) => {
      const data = specialtySchema.parse(input); identityScope(context, 'rol.administrar');
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, id);
      await repository.atomic(async (repo) => {
        await requireUser(repo, context, id);
        if (!(await repo.category(data.idCategoria))) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná una categoría activa.');
        await repo.specialty(id, data); await repo.security.revoke(id, now);
        await repo.security.audit(context, 'USUARIO_ESPECIALIDAD_GUARDADA', 'usuario_especialidad', id, data, now);
      }); return specialties(context, id);
    },
    removeSpecialty: async (context: SessionContext | null, id: number, idCategoria: number, now = new Date()) => {
      identityScope(context, 'rol.administrar');
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, id);
      await repository.atomic(async (repo) => {
        await requireUser(repo, context, id); await repo.removeSpecialty(id, idCategoria); await repo.security.revoke(id, now);
        await repo.security.audit(context, 'USUARIO_ESPECIALIDAD_RETIRADA', 'usuario_especialidad', id, { idCategoria }, now);
      }); return specialties(context, id);
    },
  };
}
export type GroupsService = ReturnType<typeof buildGroupsService>;
