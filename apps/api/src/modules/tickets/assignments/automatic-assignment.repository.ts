import { sql } from 'kysely';
import type { RawBuilder } from 'kysely';
import type { DatabaseExecutor } from '../../../infra/db/client.js';

export function createAutomaticAssignmentRepository(executor: DatabaseExecutor) {
  type Id = number | RawBuilder<number>;
  const eligible = (idGrupo: Id, idCategoria: Id, idSede: Id, idSolicitante: Id, date: string) => executor.selectFrom('usuarios as u')
      .innerJoin('usuarioEspecialidad as ue', 'ue.idUsuario', 'u.idUsuario').innerJoin('grupoMiembros as gm', 'gm.idUsuario', 'u.idUsuario')
      .innerJoin('gruposResolutores as g', 'g.idGrupo', 'gm.idGrupo').select(['u.idUsuario', 'ue.nivelDominio',
        sql<number>`(select count(*)::int from tickets carga join estados_ticket estado on estado.id_estado = carga.id_estado
          where carga.id_asignado = u.id_usuario and (estado.reloj_corre or estado.codigo = 'EN_ESPERA'))`.as('cargaActiva')])
      .where('ue.idCategoria', '=', idCategoria).where('ue.nivelDominio', '>', 0).where('gm.idGrupo', '=', idGrupo)
      .where('u.estado', '=', 'ACTIVO').where('u.idUsuario', '!=', idSolicitante).where('g.activo', '=', true)
      .where((eb) => eb.or([eb('g.idSede', 'is', null), eb('g.idSede', '=', idSede)]))
      .where('gm.desde', '<=', date).where((eb) => eb.or([eb('gm.hasta', 'is', null), eb('gm.hasta', '>=', date)]))
      .where((eb) => eb.exists(eb.selectFrom('usuarioRol as ur').innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol')
        .innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select('ur.idUsuario').whereRef('ur.idUsuario', '=', 'u.idUsuario')
        .where('p.codigo', '=', 'ticket.atender').where('ur.vigenteDesde', '<=', date)
        .where((grant) => grant.or([grant('ur.vigenteHasta', 'is', null), grant('ur.vigenteHasta', '>=', date)]))
        .where((grant) => grant.or([grant('ur.idSedeAlcance', 'is', null), grant('ur.idSedeAlcance', '=', idSede)]))));
  return {
    serialize: () => sql`select pg_advisory_xact_lock(2026002, 3)`.execute(executor),
    task: () => executor.selectFrom('tareasProgramadas').select(['idTarea', 'activa']).where('codigo', '=', 'ticket-auto-assignment').executeTakeFirstOrThrow(),
    ticket: (idTicket: number) => executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
      .selectAll('t').select('e.codigo as estado').where('t.idTicket', '=', idTicket).forUpdate('t').executeTakeFirst(),
    pending: (date: string) => executor.selectFrom('tickets as t').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado').select('t.idTicket')
      .where('e.codigo', '=', 'NUEVO').where('t.idAsignado', 'is', null).where('t.idGrupo', 'is not', null)
      .where((eb) => eb.exists(eligible(sql<number>`t.id_grupo`, sql<number>`t.id_categoria`, sql<number>`t.id_sede`, sql<number>`t.id_solicitante`, date)))
      .orderBy('t.fechaCreacion').orderBy('t.idTicket').limit(100).forUpdate('t').skipLocked().execute(),
    candidates: (idGrupo: number, idCategoria: number, idSede: number, idSolicitante: number, date: string) => eligible(idGrupo, idCategoria, idSede, idSolicitante, date).forShare('u').forShare('g').execute(),
    transition: (idOrigen: number) => executor.selectFrom('transicionesEstado as tr').innerJoin('estadosTicket as e', 'e.idEstado', 'tr.idEstadoDestino')
      .select('e.idEstado').where('tr.idEstadoOrigen', '=', idOrigen).where('e.codigo', '=', 'ASIGNADO').where('tr.automatica', '=', true).executeTakeFirst(),
    assign: async (idTicket: number, idEstado: number, idGrupo: number, idUsuario: number, now: Date) => {
      await executor.insertInto('ticketAsignaciones').values({ idTicket, idUsuario, idGrupo, tipo: 'AUTOMATICA', asignadoPor: null,
        motivo: 'Categoría, especialidad, sede y menor carga activa', desde: now }).execute();
      await executor.updateTable('tickets').set({ idEstado, idAsignado: idUsuario, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
    },
    log: (idTicket: number, idTarea: number, accion: string, values: Record<string, string | number>, now: Date) => executor.insertInto('bitacora')
      .values({ idTicket, idTarea, accion, automatica: true, idUsuario: null, idSesion: null, valorNuevo: values, fechaHora: now, hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
