import { roleAssignmentSchema, roleLinksSchema, rolesCatalogSchema } from '@helpdesk/contracts';
import type { RoleAssignment } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { assertDelegable, assertIdentitySede, identityScope, protectSelf } from '../users/index.js';
import { AppError } from '../../common/errors/app-error.js';
import type { RbacRepository } from './rbac.repository.js';

export function buildRbacService(repository: RbacRepository) {
  const requireUser = async (repo: Pick<RbacRepository, 'user'>, context: SessionContext | null, id: number) => {
    identityScope(context, 'rol.administrar'); const user = await repo.user(id);
    if (!user) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el usuario.');
    assertIdentitySede(context, 'rol.administrar', user.idSede); return user;
  };
  const list = async (context: SessionContext | null, id: number) => {
    await requireUser(repository, context, id);
    const scope = identityScope(context, 'rol.administrar');
    return roleLinksSchema.parse((await repository.links(id)).filter((link) => !scope || (link.idSedeAlcance !== null && scope.includes(link.idSedeAlcance))));
  };
  const save = async (context: SessionContext | null, id: number, idLink: number | null, input: RoleAssignment, now = new Date()) => {
    const data = roleAssignmentSchema.parse(input); assertIdentitySede(context, 'rol.administrar', data.idSedeAlcance);
    if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, id);
    await repository.atomic(async (repo) => {
      const user = await requireUser(repo, context, id);
      if (user.estado !== 'ACTIVO') throw new AppError('ENTRADA_INVALIDA', 400, 'Activá el usuario antes de asignar un rol.');
      if (idLink !== null) {
        const before = await repo.findLink(idLink);
        if (!before || before.idUsuario !== id) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró la asignación.');
        assertIdentitySede(context, 'rol.administrar', before.idSedeAlcance);
      }
      if (data.idSedeAlcance !== null && !(await repo.site(data.idSedeAlcance))) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná una sede activa.');
      const role = rolesCatalogSchema.parse(await repo.catalog()).find((item) => item.idRol === data.idRol);
      if (!role) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná un rol existente.');
      assertDelegable(context, role.permisos, data.idSedeAlcance);
      if (await repo.overlap(id, data, idLink ?? undefined)) throw new AppError('ENTRADA_INVALIDA', 409, 'Ya existe una asignación de ese rol con vigencia superpuesta.');
      const assignedId = idLink ?? (await repo.insert(id, data, context.usuario.idUsuario)).idUsuarioRol;
      if (idLink !== null) await repo.edit(idLink, data, context.usuario.idUsuario);
      await repo.security.ensureAdministrator(now); await repo.security.revoke(id, now);
      await repo.security.audit(context, idLink === null ? 'ROL_ASIGNADO' : 'ROL_ASIGNACION_EDITADA', 'usuario_rol', assignedId, { idUsuario: id, ...data }, now);
    });
    return list(context, id);
  };
  return {
    list,
    catalog: async (context: SessionContext | null) => { identityScope(context, 'rol.administrar'); return rolesCatalogSchema.parse(await repository.catalog()); },
    assign: (context: SessionContext | null, id: number, input: RoleAssignment, now = new Date()) => save(context, id, null, input, now),
    edit: (context: SessionContext | null, id: number, idLink: number, input: RoleAssignment, now = new Date()) => save(context, id, idLink, input, now),
    remove: async (context: SessionContext | null, id: number, idLink: number, now = new Date()) => {
      identityScope(context, 'rol.administrar');
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.'); protectSelf(context, id);
      await repository.atomic(async (repo) => {
        await requireUser(repo, context, id); const link = await repo.findLink(idLink);
        if (!link || link.idUsuario !== id) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró la asignación.');
        assertIdentitySede(context, 'rol.administrar', link.idSedeAlcance);
        await repo.remove(idLink); await repo.security.ensureAdministrator(now); await repo.security.revoke(id, now);
        await repo.security.audit(context, 'ROL_RETIRADO', 'usuario_rol', idLink, { idUsuario: id, idRol: link.idRol, idSedeAlcance: link.idSedeAlcance }, now);
      });
      return list(context, id);
    },
  };
}
export type RbacService = ReturnType<typeof buildRbacService>;
