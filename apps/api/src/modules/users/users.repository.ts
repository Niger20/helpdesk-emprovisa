import type { AdminQuery, UserEdit } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import { createIdentitySecurityRepository } from './identity-security.repository.js';
import type { IdentityExecutor } from './identity-security.repository.js';
import { buildIdentitySecurityService } from './identity-security.service.js';
import { AppError } from '../../common/errors/app-error.js';

function queries(executor: IdentityExecutor) {
  const base = () => executor.selectFrom('usuarios as u').innerJoin('sedes as s', 's.idSede', 'u.idSede').selectAll('u')
    .select('s.nombre as sedeNombre').where('u.origenCuenta', '=', 'LOCAL');
  const filtered = (query: AdminQuery, scope: number[] | null) => {
    let builder = base();
    if (scope) builder = builder.where('u.idSede', 'in', scope);
    if (query.q) { const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
      builder = builder.where((eb) => eb.or([eb('u.nombreCompleto', 'ilike', pattern), eb('u.username', 'ilike', pattern)])); }
    return builder;
  };
  return {
    security: buildIdentitySecurityService(createIdentitySecurityRepository(executor)),
    find: (id: number) => base().where('u.idUsuario', '=', id).executeTakeFirst(),
    access: (id: number, today: string) => executor.selectFrom('usuarioRol as ur').innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol')
      .innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select(['p.codigo', 'ur.idSedeAlcance']).where('ur.idUsuario', '=', id)
      .where((eb) => eb.or([eb('ur.vigenteHasta', 'is', null), eb('ur.vigenteHasta', '>=', today)])).execute(),
    memberships: (id: number, today: string) => executor.selectFrom('grupoMiembros as gm').innerJoin('gruposResolutores as g', 'g.idGrupo', 'gm.idGrupo')
      .select(['g.idSede']).where('gm.idUsuario', '=', id).where('g.activo', '=', true)
      .where((eb) => eb.or([eb('gm.hasta', 'is', null), eb('gm.hasta', '>=', today)])).execute(),
    list: async (query: AdminQuery, scope: number[] | null) => {
      const rows = await filtered(query, scope).orderBy('u.nombreCompleto').orderBy('u.idUsuario').limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize).execute();
      const count = await filtered(query, scope).clearSelect().select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      return { rows, total: Number(count.total) };
    },
    catalogs: async (scope: number[] | null) => {
      let sedes = executor.selectFrom('sedes').select(['idSede', 'nombre']).where('activa', '=', true);
      let departamentos = executor.selectFrom('departamentos').select(['idDepartamento', 'idSede', 'nombre']);
      let usuarios = executor.selectFrom('usuarios').select(['idUsuario', 'idSede', 'nombreCompleto']).where('estado', '=', 'ACTIVO');
      if (scope) { sedes = sedes.where('idSede', 'in', scope); departamentos = departamentos.where('idSede', 'in', scope); usuarios = usuarios.where('idSede', 'in', scope); }
      return { sedes: await sedes.orderBy('nombre').execute(), departamentos: await departamentos.orderBy('nombre').execute(),
        usuarios: await usuarios.orderBy('nombreCompleto').execute(), categorias: await executor.selectFrom('categorias')
          .select(['idCategoria', 'nombre']).where('activa', '=', true).orderBy('nombre').execute() };
    },
    references: async (input: UserEdit) => ({
      sede: await executor.selectFrom('sedes').innerJoin('calendariosLaborales as c', 'c.idCalendario', 'sedes.idCalendario')
        .select('sedes.idSede').where('sedes.idSede', '=', input.idSede).where('sedes.activa', '=', true).executeTakeFirst(),
      departamento: input.idDepartamento === null || Boolean(await executor.selectFrom('departamentos').select('idDepartamento')
        .where('idDepartamento', '=', input.idDepartamento).where('idSede', '=', input.idSede).executeTakeFirst()),
      jefe: input.idJefeInmediato === null || Boolean(await executor.selectFrom('usuarios').select('idUsuario').where('idUsuario', '=', input.idJefeInmediato)
        .where('idSede', '=', input.idSede).where('estado', '=', 'ACTIVO').executeTakeFirst()),
    }),
    insert: (input: UserEdit, username: string, passwordHash: string) => executor.insertInto('usuarios').values({ ...input, username,
      passwordHash, origenCuenta: 'LOCAL', estado: 'ACTIVO', intentosFallidos: 0 }).returning('idUsuario').executeTakeFirstOrThrow(),
    edit: async (id: number, input: UserEdit) => { await executor.updateTable('usuarios').set(input).where('idUsuario', '=', id).execute(); },
    state: async (id: number, activo: boolean) => { await executor.updateTable('usuarios').set({ estado: activo ? 'ACTIVO' : 'INACTIVO' }).where('idUsuario', '=', id).execute(); },
    unlock: async (id: number) => { await executor.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null }).where('idUsuario', '=', id).execute(); },
    password: async (id: number, passwordHash: string) => { await executor.updateTable('usuarios').set({ passwordHash, intentosFallidos: 0, bloqueadoHasta: null }).where('idUsuario', '=', id).execute(); },
  };
}
export function createUsersRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repository: ReturnType<typeof queries>) => Promise<T>) =>
    database.transaction().execute(async (trx) => { const repository = queries(trx); await repository.security.lock(); return action(repository); })
      .catch((error: unknown) => {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
          throw new AppError('ENTRADA_INVALIDA', 409, 'El usuario o correo ya están registrados.');
        }
        throw error;
      }) };
}
export type UsersRepository = ReturnType<typeof createUsersRepository>;
