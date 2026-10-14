import { sql } from 'kysely';
import type { Transaction } from 'kysely';
import type { Database } from '../../../infra/db/client.js';
import type { DB } from '../../../infra/db/generated-types.js';
import type { SessionContext } from '../../auth/index.js';

type Executor = Database | Transaction<DB>;
export function createAssignmentsRepository(executor: Executor) {
  return {
    lock: (numero: string) => executor.selectFrom('tickets').select('idTicket').where('numero', '=', numero).forUpdate().executeTakeFirst(),
    candidates: (idGrupo: number | null, idSede: number, date: string) => executor.selectFrom('usuarios as u')
      .select(['u.idUsuario', 'u.nombreCompleto']).where('u.estado', '=', 'ACTIVO')
      .where((eb) => eb.exists(eb.selectFrom('usuarioRol as ur').innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol')
        .innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select('ur.idUsuario')
        .whereRef('ur.idUsuario', '=', 'u.idUsuario').where('p.codigo', '=', 'ticket.atender').where('ur.vigenteDesde', '<=', date)
        .where((grant) => grant.or([grant('ur.vigenteHasta', 'is', null), grant('ur.vigenteHasta', '>=', date)]))
        .where((grant) => grant.or([grant('ur.idSedeAlcance', 'is', null), grant('ur.idSedeAlcance', '=', idSede)]))))
      .where((eb) => idGrupo === null ? eb('u.idSede', '=', idSede) : eb.exists(eb.selectFrom('grupoMiembros as gm')
        .innerJoin('gruposResolutores as g', 'g.idGrupo', 'gm.idGrupo').select('gm.idUsuario').whereRef('gm.idUsuario', '=', 'u.idUsuario')
        .where('gm.idGrupo', '=', idGrupo).where('g.activo', '=', true).where('gm.desde', '<=', date)
        .where((member) => member.or([member('gm.hasta', 'is', null), member('gm.hasta', '>=', date)]))
        .where((group) => group.or([group('g.idSede', 'is', null), group('g.idSede', '=', idSede)]))))
      .orderBy('u.nombreCompleto').execute(),
    transition: (idOrigen: number, destino: string) => executor.selectFrom('transicionesEstado as tr')
      .innerJoin('estadosTicket as e', 'e.idEstado', 'tr.idEstadoDestino').innerJoin('permisos as p', 'p.idPermiso', 'tr.idPermiso')
      .select(['tr.idEstadoDestino', 'tr.requiereMotivo', 'tr.requiereConfirmacionSolicitante', 'p.codigo'])
      .where('tr.idEstadoOrigen', '=', idOrigen).where('e.codigo', '=', destino).where('tr.automatica', '=', false).executeTakeFirst(),
    assign: async (idTicket: number, idUsuario: number, idGrupo: number | null, idEstado: number, motivo: string, context: SessionContext, now: Date) => {
      await executor.updateTable('ticketAsignaciones').set({ hasta: now }).where('idTicket', '=', idTicket).where('hasta', 'is', null).execute();
      await executor.insertInto('ticketAsignaciones').values({ idTicket, idUsuario, idGrupo, tipo: 'MANUAL', motivo, desde: now, asignadoPor: context.usuario.idUsuario }).execute();
      await executor.updateTable('tickets').set({ idAsignado: idUsuario, idEstado, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
    },
    attend: async (idTicket: number, idEstado: number, now: Date, userId: number) => {
      await executor.updateTable('tickets').set({ idEstado, fechaPrimeraRespuesta: sql<Date>`coalesce(fecha_primera_respuesta, ${now})`, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
      await executor.updateTable('ticketEscalamientos').set({ aceptadoPor: userId, aceptadoEn: now }).where('idTicket', '=', idTicket).where('aceptadoEn', 'is', null).execute();
    },
    log: (idTicket: number, context: SessionContext, accion: string, anterior: Record<string, string | number | null>, nuevo: Record<string, string | number | null>, now: Date) => executor.insertInto('bitacora').values({
      idTicket, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, accion, fechaHora: now, automatica: false, direccionIp: context.direccionIp ?? null,
      valorAnterior: anterior, valorNuevo: nuevo, hashPrevio: '', hashRegistro: '',
    }).execute(),
  };
}
