import { DateTime } from 'luxon';
import { roleCatalogInputSchema, roleCatalogUpdateSchema } from '@helpdesk/contracts';
import type { RoleCatalogInput, RoleCatalogUpdate } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { protectSelf } from '../../users/index.js';
import { AppError } from '../../../common/errors/app-error.js';
import type { RoleCatalogRepository } from './role-catalog.repository.js';
import { mapCatalog } from './role-catalog.mapper.js';
import { assertUnchanged, requireCatalogActor } from './role-catalog.policies.js';

export function buildRoleCatalogService(repository: RoleCatalogRepository) {
  const save = async (context: SessionContext | null, idRol: number | null, input: RoleCatalogInput | RoleCatalogUpdate, now: Date) => {
    requireCatalogActor(context);
    const update = idRol === null ? null : roleCatalogUpdateSchema.parse(input);
    const data = update?.datos ?? roleCatalogInputSchema.parse(input);
    return repository.atomic(async (repo) => {
      const today = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
      const actor = await repo.actorGrants(context.usuario.idUsuario, context.idSesion, today, now);
      const global = new Set(actor.filter((grant) => grant.idSedeAlcance === null).map((grant) => grant.codigo));
      if (!global.has('rol.administrar') || !actor.some((grant) => grant.codigo === 'auth.sesion')
        || data.permisos.some((code) => !global.has(code))) throw new AppError('NO_AUTORIZADO', 403, 'Solo podés conceder permisos que poseés con alcance global.');
      const catalog = await mapCatalog(repo);
      const existing = catalog.roles.find((role) => role.idRol === idRol);
      if (idRol !== null) {
        if (!existing || !update) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el rol.');
        assertUnchanged(existing, update.anterior);
      }
      if (catalog.roles.some((role) => role.codigo === data.codigo && role.idRol !== idRol)) throw new AppError('ENTRADA_INVALIDA', 409, 'El código de rol ya existe.');
      const affected = idRol === null ? [] : await repo.affected(idRol, today);
      for (const user of affected) {
        protectSelf(context, user.idUsuario);
        if (!user.activa || (user.idSedeAlcance !== null && user.idSedeAlcance !== user.idSede)) {
          throw new AppError('ENTRADA_INVALIDA', 409, 'Revisá las sedes y asignaciones de los usuarios afectados antes de modificar el rol.');
        }
      }
      const permissions = await repo.permissions();
      const ids = data.permisos.map((code) => permissions.find((permission) => permission.codigo === code)?.idPermiso);
      if (ids.some((id) => id === undefined)) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná permisos del catálogo existente.');
      const savedId = idRol ?? (await repo.insert(data)).idRol;
      if (idRol !== null) await repo.edit(idRol, data);
      await repo.replace(savedId, ids.filter((id): id is number => id !== undefined));
      await repo.security.ensureAdministrator(now);
      for (const idUsuario of new Set(affected.map((user) => user.idUsuario))) await repo.security.revoke(idUsuario, now);
      await repo.security.audit(context, idRol === null ? 'ROL_CREADO' : 'ROL_EDITADO', 'roles', savedId,
        { codigo: data.codigo, nombre: data.nombre, descripcion: data.descripcion, codigoAnterior: existing?.codigo ?? null,
          nombreAnterior: existing?.nombre ?? null, descripcionAnterior: existing?.descripcion ?? null,
          permisos: data.permisos, permisosAnteriores: existing?.permisos ?? [],
          usuariosAfectados: [...new Set(affected.map((user) => user.idUsuario))] }, now);
      const saved = (await mapCatalog(repo)).roles.find((role) => role.idRol === savedId);
      if (!saved) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el rol guardado.');
      return saved;
    });
  };
  return {
    catalog: async (context: SessionContext | null) => { requireCatalogActor(context); return mapCatalog(repository); },
    create: (context: SessionContext | null, input: RoleCatalogInput, now = new Date()) => save(context, null, input, now),
    edit: (context: SessionContext | null, idRol: number, input: RoleCatalogUpdate, now = new Date()) => save(context, idRol, input, now),
  };
}
export type RoleCatalogService = ReturnType<typeof buildRoleCatalogService>;
