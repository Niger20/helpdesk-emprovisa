import { ticketLifecycleSchema, ticketLifecyclePermission } from '@helpdesk/contracts';
import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { requireTicketPermission } from '../tickets.policies.js';
import { loadTicketForWrite, checkTicketGrant } from '../assignments/assignments.service.js';
import type { TicketAtomic } from '../assignments/assignments.service.js';
import { executeEscalation } from '../escalations/escalations.service.js';
import { executePause } from '../pauses/pauses.service.js';
import { executeResolution } from '../resolutions/resolutions.service.js';
import { executeReopening } from '../reopenings/reopenings.service.js';
import { executeReclassification } from './reclassification.service.js';
import type { SurveyDelivery } from '../../../infra/mail/survey-delivery.js';
import { surveyIssuer } from '../../../infra/mail/survey-delivery.js';

export function createLifecycleActionsService(atomic: TicketAtomic, delivery: SurveyDelivery = surveyIssuer) {
  return async (context: SessionContext | null, numero: string, input: TicketLifecycleCommand, now = new Date()) => {
    const data = ticketLifecycleSchema.parse(input);
    requireTicketPermission(context, ticketLifecyclePermission[data.accion]);
    const closed = await atomic(async (repo) => {
      const row = await loadTicketForWrite(repo, context, numero, data.version, now);
      checkTicketGrant(context, ticketLifecyclePermission[data.accion], row);
      switch (data.accion) {
        case 'reclasificar': return executeReclassification(repo, row, context, data, now);
        case 'escalar': return executeEscalation(repo, row, context, data, now);
        case 'pausar': case 'reanudar': return executePause(repo, row, context, data, now);
        case 'resolver': case 'cerrar': case 'cancelar': return executeResolution(repo, row, context, data, now, delivery);
        case 'reabrir': case 'rechazar': return executeReopening(repo, row, context, data, now);
      }
    });
    if (closed) delivery.deliver(closed.idUsuario, closed.numero, closed.invitation);
    return { numero };
  };
}
