import { sql } from 'kysely';
import type { DatabaseExecutor } from '../../infra/db/client.js';
import { notificationEventSchema } from '@helpdesk/contracts';

export function createNotificationEventsRepository(executor: DatabaseExecutor) {
  return {
    unqueued: (date: string) => executor.selectFrom('bitacora as b').innerJoin('tickets as t', 't.idTicket', 'b.idTicket')
      .innerJoin('plantillasNotificacion as p', 'p.codigoEvento', 'b.accion')
      .innerJoin('usuarios as u', (join) => join.on((eb) => eb.or([
        eb('u.idUsuario', '=', eb.ref('t.idSolicitante')),
        eb('u.idUsuario', '=', sql<number>`coalesce((b.valor_nuevo->>'idAsignado')::int, t.id_asignado)`),
        eb.and([eb('b.accion', 'in', ['ESCALAMIENTO', 'ALERTA_SLA']), eb.exists(eb.selectFrom('usuarioRol as ur')
          .innerJoin('rolPermiso as rp', 'rp.idRol', 'ur.idRol').innerJoin('permisos as permiso', 'permiso.idPermiso', 'rp.idPermiso')
          .select('ur.idUsuario').whereRef('ur.idUsuario', '=', 'u.idUsuario').where('permiso.codigo', '=', 'ticket.reasignar')
          .where('ur.vigenteDesde', '<=', date).where((grant) => grant.or([grant('ur.vigenteHasta', 'is', null), grant('ur.vigenteHasta', '>=', date)]))
          .where((grant) => grant.or([grant('ur.idSedeAlcance', 'is', null), grant('ur.idSedeAlcance', '=', eb.ref('t.idSede'))])))]),
      ])))
      .leftJoin('notificaciones as n', (join) => join.onRef('n.idBitacora', '=', 'b.idBitacora').onRef('n.idDestinatario', '=', 'u.idUsuario'))
      .select(['b.idBitacora', 'b.idTicket', 'p.idPlantilla', 'p.asunto', 't.numero', 'u.idUsuario', 'u.correo'])
      .where('b.accion', 'in', notificationEventSchema.options).where('p.activa', '=', true).where('u.estado', '=', 'ACTIVO')
      .where('n.idNotificacion', 'is', null).orderBy('b.idBitacora').orderBy('u.idUsuario').limit(100).execute(),
    enqueue: (row: { idBitacora: string; idTicket: number; idPlantilla: number; asunto: string; numero: string; idUsuario: number; correo: string }, now: Date) => executor.insertInto('notificaciones')
      .values({ idBitacora: row.idBitacora, idTicket: row.idTicket, idPlantilla: row.idPlantilla, idDestinatario: row.idUsuario,
        correoDestino: row.correo, asunto: `${row.numero}: ${row.asunto}`.slice(0, 150), estado: 'PENDIENTE', intentos: 0, encoladaEn: now, proximoIntento: now })
      .onConflict((conflict) => conflict.columns(['idBitacora', 'idDestinatario']).doNothing()).execute(),
  };
}
