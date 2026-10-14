import type { DatabaseExecutor } from '../../infra/db/client.js';
import type { NotificationQuery } from '@helpdesk/contracts';
import { createNotificationEventsRepository } from './notifications-events.repository.js';

export function createNotificationsRepository(executor: DatabaseExecutor) {
  const own = (idUsuario: number) => executor.selectFrom('notificaciones as n').leftJoin('tickets as t', 't.idTicket', 'n.idTicket').where('n.idDestinatario', '=', idUsuario);
  return { ...createNotificationEventsRepository(executor),
    pending: (now: Date) => executor.selectFrom('notificaciones').selectAll().where('estado', '=', 'PENDIENTE')
      .where('proximoIntento', '<=', now).orderBy('proximoIntento').limit(100).forUpdate().skipLocked().execute(),
    availableSurvey: (idUsuario: number, numero: string, tokenHash: string, now: Date) => executor.selectFrom('encuestasCsat as s')
      .innerJoin('tickets as t', 't.idTicket', 's.idTicket').innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
      .select('s.idEncuesta').where('t.numero', '=', numero).where('t.idSolicitante', '=', idUsuario).where('s.tokenHash', '=', tokenHash)
      .where('s.respondidaEn', 'is', null).where('s.expiraEn', '>', now).where('e.codigo', '=', 'CERRADO').executeTakeFirst(),
    sent: (idNotificacion: string, intentos: number, now: Date) => executor.updateTable('notificaciones')
      .set({ estado: 'ENVIADA', intentos, enviadaEn: now, ultimoError: null }).where('idNotificacion', '=', idNotificacion).execute(),
    failed: (idNotificacion: string, intentos: number, retry: Date) => executor.updateTable('notificaciones')
      .set({ estado: intentos >= 5 ? 'ERROR' : 'PENDIENTE', intentos, ultimoError: 'Fallo del transporte simulado', proximoIntento: retry })
      .where('idNotificacion', '=', idNotificacion).execute(),
    list: async (idUsuario: number, query: NotificationQuery) => ({
      total: Number((await own(idUsuario).select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow()).total),
      data: await own(idUsuario).select(['n.idNotificacion', 't.numero', 'n.asunto', 'n.estado', 'n.intentos', 'n.encoladaEn', 'n.enviadaEn'])
        .orderBy('n.encoladaEn', 'desc').orderBy('n.idNotificacion', 'desc').limit(query.pageSize).offset((query.page - 1) * query.pageSize).execute(),
    }),
  };
}
export type NotificationsRepository = ReturnType<typeof createNotificationsRepository>;
