import { DateTime } from 'luxon';
import { notificationListSchema, notificationQuerySchema, surveyInvitationsSchema } from '@helpdesk/contracts';
import type { NotificationQuery, SurveyInvitationCandidate } from '@helpdesk/contracts';
import type { NotificationsRepository } from './notifications.repository.js';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { tokenHash } from '../../common/crypto/session-tokens.js';

export type SimulatedTransport = (notification: { asunto: string; correoDestino: string }) => Promise<void>;
export function createNotificationsService(repo: NotificationsRepository, transport: SimulatedTransport = async () => {}) {
  return {
    invitations: async (context: SessionContext | null, candidates: SurveyInvitationCandidate[], now = new Date()) => {
      if (!context?.usuario.permisos.includes('auth.sesion')) throw new AppError('NO_AUTORIZADO', 403, 'Iniciá sesión para ver tus encuestas.');
      const data: SurveyInvitationCandidate[] = [];
      for (const candidate of candidates.slice(-50)) {
        const token = candidate.enlace.split('#')[1];
        if (token && await repo.availableSurvey(context.usuario.idUsuario, candidate.numero, tokenHash(token), now)) data.push(candidate);
      }
      return surveyInvitationsSchema.parse({ data, simulada: true });
    },
    dispatch: async (now = new Date()) => {
      const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
      for (const row of await repo.unqueued(date)) await repo.enqueue(row, now);
      for (const row of await repo.pending(now)) {
        const attempts = row.intentos + 1;
        try { await transport(row); }
        catch { await repo.failed(row.idNotificacion, attempts, new Date(now.getTime() + 60_000 * 2 ** (attempts - 1))); continue; }
        await repo.sent(row.idNotificacion, attempts, now);
      }
    },
    list: async (context: SessionContext | null, input: NotificationQuery) => {
      if (!context?.usuario.permisos.includes('auth.sesion')) throw new AppError('NO_AUTORIZADO', 403, 'Iniciá sesión para ver tus avisos.');
      const query = notificationQuerySchema.parse(input);
      const result = await repo.list(context.usuario.idUsuario, query);
      return notificationListSchema.parse({ data: result.data.map((row) => ({ ...row, encoladaEn: row.encoladaEn.toISOString(), enviadaEn: row.enviadaEn?.toISOString() ?? null })),
        meta: { ...query, total: result.total }, simulada: true });
    },
  };
}
