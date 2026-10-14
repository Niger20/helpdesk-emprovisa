import { adminCatalogSchema, adminQuerySchema, localPasswordSchema, permisoSchema, userCreateSchema, userEditSchema, userStateSchema } from '@helpdesk/contracts';
import type { AdminQuery, UserCreate, UserEdit } from '@helpdesk/contracts';
import { hash, argon2id } from 'argon2';
import { DateTime } from 'luxon';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { assertIdentitySede, identityScope, protectSelf } from './users.policies.js';
import { mapAdminUser } from './users.mapper.js';
import type { UsersRepository } from './users.repository.js';

export function buildUsersService(repository: UsersRepository) {
  const requireUser = async (repo: Pick<UsersRepository, 'find'>, context: SessionContext | null, id: number) => {
    identityScope(context, 'usuario.administrar');
    const row = await repo.find(id);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el usuario local.');
    assertIdentitySede(context, 'usuario.administrar', row.idSede);
    return row;
  };
  const references = async (repo: Pick<UsersRepository, 'references'>, data: UserEdit) => {
    const refs = await repo.references(data);
    if (!refs.sede || !refs.departamento || !refs.jefe) throw new AppError('ENTRADA_INVALIDA', 400, 'Sede, departamento y jefe deben estar vigentes y pertenecer a la misma sede.');
  };
  const protectAccess = async (repo: Pick<UsersRepository, 'access'>, context: SessionContext, id: number, now: Date) => {
    const access = await repo.access(id, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
    for (const grant of access) assertIdentitySede(context, permisoSchema.parse(grant.codigo), grant.idSedeAlcance);
  };
  const detail = async (context: SessionContext | null, id: number) => mapAdminUser(await requireUser(repository, context, id));
  const mutate = async (context: SessionContext | null, id: number, accion: string,
    action: (repo: Pick<UsersRepository, 'state' | 'unlock' | 'password'>) => Promise<void>, now = new Date()) => {
    identityScope(context, 'usuario.administrar');
    if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
    protectSelf(context, id);
    await repository.atomic(async (repo) => {
      await requireUser(repo, context, id);
      await protectAccess(repo, context, id, now);
      await action(repo);
      await repo.security.ensureAdministrator(now);
      await repo.security.revoke(id, now);
      await repo.security.audit(context, accion, 'usuarios', id, { idUsuario: id }, now);
    });
    return detail(context, id);
  };
  return {
    detail,
    list: async (context: SessionContext | null, input: AdminQuery) => {
      const scope = identityScope(context, 'usuario.administrar'); const query = adminQuerySchema.parse(input);
      const { rows, total } = await repository.list(query, scope);
      return { data: rows.map(mapAdminUser), meta: { page: query.page, pageSize: query.pageSize, total } };
    },
    catalogs: async (context: SessionContext | null) => adminCatalogSchema.parse(await repository.catalogs(identityScope(context, 'usuario.administrar'))),
    create: async (context: SessionContext | null, input: UserCreate, now = new Date()) => {
      const data = userCreateSchema.parse(input); assertIdentitySede(context, 'usuario.administrar', data.idSede);
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
      const { password, username, ...profile } = data;
      const passwordHash = await hash(password, { type: argon2id });
      const id = await repository.atomic(async (repo) => {
        await references(repo, profile);
        const { idUsuario } = await repo.insert(profile, username, passwordHash);
        await repo.security.audit(context, 'USUARIO_CREADO', 'usuarios', idUsuario, { idSede: data.idSede, origenCuenta: 'LOCAL' }, now);
        return idUsuario;
      });
      return detail(context, id);
    },
    edit: async (context: SessionContext | null, id: number, input: UserEdit, now = new Date()) => {
      const data = userEditSchema.parse(input); assertIdentitySede(context, 'usuario.administrar', data.idSede);
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
      await repository.atomic(async (repo) => {
        const before = await requireUser(repo, context, id);
        await protectAccess(repo, context, id, now);
        if (id === data.idJefeInmediato) throw new AppError('ENTRADA_INVALIDA', 400, 'El usuario no puede ser su propio jefe.');
        if (before.idSede !== data.idSede) protectSelf(context, id);
        if (before.idSede !== data.idSede) {
          const memberships = await repo.memberships(id, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
          if (memberships.some((group) => group.idSede !== null && group.idSede !== data.idSede)) {
            throw new AppError('ENTRADA_INVALIDA', 409, 'Retirá las membresías de grupos de otras sedes antes de trasladar al usuario.');
          }
        }
        await references(repo, data); await repo.edit(id, data);
        await repo.security.ensureAdministrator(now);
        if (before.idSede !== data.idSede || before.idDepartamento !== data.idDepartamento) await repo.security.revoke(id, now);
        await repo.security.audit(context, 'USUARIO_EDITADO', 'usuarios', id, { idSedeAnterior: before.idSede, idSede: data.idSede,
          campos: Object.keys(data).filter((key) => key !== 'correo') }, now);
      });
      return detail(context, id);
    },
    state: (context: SessionContext | null, id: number, activo: boolean) => {
      const data = userStateSchema.parse({ activo });
      return mutate(context, id, data.activo ? 'USUARIO_ACTIVADO' : 'USUARIO_DESACTIVADO', (repo) => repo.state(id, data.activo));
    },
    unlock: (context: SessionContext | null, id: number) => mutate(context, id, 'USUARIO_DESBLOQUEADO', (repo) => repo.unlock(id)),
    resetPassword: async (context: SessionContext | null, id: number, password: string) => {
      identityScope(context, 'usuario.administrar');
      const passwordHash = await hash(localPasswordSchema.parse(password), { type: argon2id });
      return mutate(context, id, 'USUARIO_PASSWORD_RESTABLECIDA', (repo) => repo.password(id, passwordHash));
    },
  };
}
export type UsersService = ReturnType<typeof buildUsersService>;
