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

export function createLifecycleActionsService(atomic: TicketAtomic) {
  return async (context: SessionContext | null, numero: string, input: TicketLifecycleCommand, now = new Date()) => {
    const data = ticketLifecycleSchema.parse(input);
    requireTicketPermission(context, ticketLifecyclePermission[data.accion]);
    await atomic(async (repo) => {
      const row = await loadTicketForWrite(repo, context, numero, data.version, now);
      checkTicketGrant(context, ticketLifecyclePermission[data.accion], row);
      switch (data.accion) {
        case 'reclasificar': return executeReclassification(repo, row, context, data, now);
        case 'escalar': return executeEscalation(repo, row, context, data, now);
        case 'pausar': case 'reanudar': return executePause(repo, row, context, data, now);
        case 'resolver': case 'cerrar': case 'cancelar': return executeResolution(repo, row, context, data, now);
        case 'reabrir': case 'rechazar': return executeReopening(repo, row, context, data, now);
      }
    });
    return { numero };
  };
}
