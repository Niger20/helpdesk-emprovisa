import { sql } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { Transaction } from 'kysely';
import type { DB } from '../../infra/db/generated-types.js';

export function createJobsEscalationRepository(executor: Database | Transaction<DB>) {
  return {
    escalationTarget: (idSede: number, idSolicitante: number, date: string) => executor.selectFrom('gruposResolutores as g')
      .innerJoin('grupoMiembros as gm', 'gm.idGrupo', 'g.idGrupo').innerJoin('usuarios as u', 'u.idUsuario', 'gm.idUsuario')
      .select(['g.idGrupo', 'u.idUsuario']).where('g.activo', '=', true).where('g.nivel', '=', 2).where('u.estado', '=', 'ACTIVO')
      .where('u.idUsuario', '!=', idSolicitante).where('gm.desde', '<=', date)
      .where((eb) => eb.or([eb('gm.hasta', 'is', null), eb('gm.hasta', '>=', date)]))
      .where((eb) => eb.or([eb('g.idSede', 'is', null), eb('g.idSede', '=', idSede)]))
      .where((eb) => eb.exists(eb.selectFrom('usuarioRol as ur').innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol')
        .innerJoin('permisos as p', 'p.idPermiso', 'rp.idPermiso').select('ur.idUsuario').whereRef('ur.idUsuario', '=', 'u.idUsuario')
        .where('p.codigo', '=', 'ticket.atender').where('ur.vigenteDesde', '<=', date)
        .where((grant) => grant.or([grant('ur.vigenteHasta', 'is', null), grant('ur.vigenteHasta', '>=', date)]))
        .where((grant) => grant.or([grant('ur.idSedeAlcance', 'is', null), grant('ur.idSedeAlcance', '=', idSede)]))))
      .orderBy(sql<number>`(select count(*) from tickets tt join estados_ticket ee on ee.id_estado = tt.id_estado where tt.id_asignado = u.id_usuario and ee.reloj_corre)`, 'asc')
      .orderBy('g.idGrupo').orderBy('u.idUsuario').executeTakeFirst(),
    level: async (idGrupo: number | null) => idGrupo === null ? 1 : (await executor.selectFrom('gruposResolutores').select('nivel').where('idGrupo', '=', idGrupo).executeTakeFirstOrThrow()).nivel,
    escalate: async (idTicket: number, idEstado: number, idGrupo: number, idUsuario: number, nivelOrigen: number, now: Date) => {
      const motivo = 'Vencimiento del plazo de primera respuesta';
      await executor.updateTable('ticketAsignaciones').set({ hasta: now }).where('idTicket', '=', idTicket).where('hasta', 'is', null).execute();
      await executor.insertInto('ticketAsignaciones').values({ idTicket, idGrupo, idUsuario, tipo: 'ESCALAMIENTO', motivo, desde: now, asignadoPor: null }).execute();
      await executor.insertInto('ticketEscalamientos').values({ idTicket, idGrupoDestino: idGrupo, nivelOrigen, nivelDestino: 2,
        tipo: 'AUTOMATICO', motivo, escaladoPor: null, fecha: now }).execute();
      await executor.updateTable('tickets').set({ idEstado, idGrupo, idAsignado: idUsuario, version: sql<number>`version + 1` }).where('idTicket', '=', idTicket).execute();
    },
  };
}
