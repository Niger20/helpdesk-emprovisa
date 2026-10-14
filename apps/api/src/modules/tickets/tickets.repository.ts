import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { TicketQuery } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { TicketScope } from './tickets.policies.js';
import { createTicketWriteRepository } from './ticket-write.repository.js';
import { createAssignmentsRepository } from './assignments/assignments.repository.js';
import { createCommentsRepository } from './comments/comments.repository.js';
import { createLifecycleRepository } from './lifecycle/lifecycle.repository.js';
import { createPausesRepository } from './pauses/pauses.repository.js';
import { createEscalationsRepository } from './escalations/escalations.repository.js';
import { createResolutionsRepository } from './resolutions/resolutions.repository.js';
import { createReopeningsRepository } from './reopenings/reopenings.repository.js';

type Executor = Database | Transaction<DB>;
export function createTicketsRepository(database: Database, executor: Executor = database) {
  const base = (scope: TicketScope, now: Date) => executor.selectFrom('tickets as t')
    .innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado').innerJoin('prioridadesSla as p', 'p.idPrioridad', 't.idPrioridad')
    .innerJoin('categorias as c', 'c.idCategoria', 't.idCategoria').innerJoin('usuarios as u', 'u.idUsuario', 't.idSolicitante')
    .innerJoin('sedes as s', 's.idSede', 't.idSede').leftJoin('usuarios as a', 'a.idUsuario', 't.idAsignado')
    .leftJoin('activosTi as activo', 'activo.idActivo', 't.idActivo')
    .leftJoin('tickets as origen', 'origen.idTicket', 't.idTicketOrigen')
    .where((eb) => scope.all ? eb.val(true) : eb.or([
      ...(scope.own ? [eb('t.idSolicitante', '=', scope.userId)] : []),
      ...(scope.sites.length ? [eb('t.idSede', 'in', scope.sites)] : []),
      ...(scope.group ? [eb('t.idAsignado', '=', scope.userId), eb('t.idGrupo', 'in',
        eb.selectFrom('grupoMiembros').select('idGrupo').where('idUsuario', '=', scope.userId)
          .where('desde', '<=', sql<string>`(${now}::timestamptz at time zone 'America/Managua')::date`)
          .where((member) => member.or([member('hasta', 'is', null), member('hasta', '>=', sql<string>`(${now}::timestamptz at time zone 'America/Managua')::date`)])))] : []),
    ]));
  const selected = (scope: TicketScope, now: Date) => base(scope, now).selectAll('t').select([
    'e.codigo as estado', 'e.relojCorre', 'p.codigo as prioridad', 'p.minutosRespuesta', 'p.minutosSolucion', 'p.modoCalendario',
    'c.nombre as categoria', 'u.nombreCompleto as solicitante', 's.nombre as sede', 's.idCalendario',
    'a.nombreCompleto as asignado', 'activo.codigoPatrimonial as activo', 'origen.numero as numeroTicketOrigen',
  ]);
  return {
    ...createTicketWriteRepository(executor),
    ...createAssignmentsRepository(executor),
    ...createCommentsRepository(executor),
    ...createLifecycleRepository(executor),
    ...createPausesRepository(executor),
    ...createEscalationsRepository(executor),
    ...createResolutionsRepository(executor),
    ...createReopeningsRepository(executor),
    list: async (scope: TicketScope, filters: TicketQuery, now: Date) => {
      const apply = <T extends ReturnType<typeof base>>(query: T) => query
        .where((eb) => filters.search ? eb.or([eb('t.numero', 'ilike', `%${filters.search}%`), eb('t.titulo', 'ilike', `%${filters.search}%`)]) : eb.val(true))
        .where((eb) => filters.estado ? eb('e.codigo', '=', filters.estado) : eb.val(true))
        .where((eb) => filters.prioridad ? eb('p.codigo', '=', filters.prioridad) : eb.val(true));
      const count = await apply(base(scope, now)).select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      const rows = await selected(scope, now)
        .where((eb) => filters.search ? eb.or([eb('t.numero', 'ilike', `%${filters.search}%`), eb('t.titulo', 'ilike', `%${filters.search}%`)]) : eb.val(true))
        .where((eb) => filters.estado ? eb('e.codigo', '=', filters.estado) : eb.val(true))
        .where((eb) => filters.prioridad ? eb('p.codigo', '=', filters.prioridad) : eb.val(true))
        .orderBy('t.fechaCreacion', filters.sort.startsWith('-') ? 'desc' : 'asc').orderBy('t.numero', 'desc')
        .limit(filters.pageSize).offset((filters.page - 1) * filters.pageSize).execute();
      return { rows, total: Number(count.total) };
    },
    find: (scope: TicketScope, numero: string, now: Date) => selected(scope, now).where('t.numero', '=', numero).executeTakeFirst(),
    comments: (id: number, internal: boolean) => executor.selectFrom('ticketComentarios as c').leftJoin('usuarios as u', 'u.idUsuario', 'c.idAutor')
      .select(['c.contenido', 'c.visibilidad', 'c.fechaCreacion', 'u.nombreCompleto as autor'])
      .where('c.idTicket', '=', id).where((eb) => internal ? eb.val(true) : eb('c.visibilidad', '=', 'PUBLICO')).orderBy('c.fechaCreacion').execute(),
    history: (id: number, internal: boolean) => executor.selectFrom('bitacora as b').leftJoin('usuarios as u', 'u.idUsuario', 'b.idUsuario')
      .select(['b.accion', 'b.fechaHora', 'u.nombreCompleto as autor']).where('b.idTicket', '=', id)
      .where((eb) => internal ? eb.val(true) : eb('b.accion', 'in', ['CREACION', 'CAMBIO_ESTADO', 'ASIGNACION', 'ESCALAMIENTO', 'PAUSA', 'REAPERTURA', 'COMENTARIO', 'REANUDACION', 'RESOLUCION', 'CIERRE', 'CANCELACION', 'RECLASIFICACION', 'ADJUNTO']))
      .orderBy('b.fechaHora').orderBy('b.idBitacora').execute(),
    pauses: (id: number) => executor.selectFrom('pausasSla').select(['inicio', 'fin', 'motivo', 'detalle']).where('idTicket', '=', id).execute(),
    cycleStart: async (id: number, creation: Date) => (await executor.selectFrom('ticketReaperturas').select('fecha').where('idTicket', '=', id).orderBy('fecha', 'desc').executeTakeFirst())?.fecha ?? creation,
  };
}
export type TicketsRepository = ReturnType<typeof createTicketsRepository>;
export type TicketRow = NonNullable<Awaited<ReturnType<TicketsRepository['find']>>>;
export function withTicketsTransaction<T>(database: Database, action: (repository: TicketsRepository) => Promise<T>) {
  return database.transaction().execute((trx) => action(createTicketsRepository(database, trx)));
}
