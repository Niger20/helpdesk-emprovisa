import { ticketCommentSchema } from '@helpdesk/contracts';
import type { TicketComment } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { requireTicketPermission } from '../tickets.policies.js';
import { loadTicketForWrite, checkTicketGrant } from '../assignments/assignments.service.js';
import type { TicketAtomic } from '../assignments/assignments.service.js';
import { AppError } from '../../../common/errors/app-error.js';

export function createCommentsService(atomic: TicketAtomic) {
  return { comment: async (context: SessionContext | null, numero: string, input: TicketComment, now = new Date()) => {
    requireTicketPermission(context, 'ticket.comentar');
    const data = ticketCommentSchema.parse(input);
    await atomic(async (repo) => {
      const row = await loadTicketForWrite(repo, context, numero, data.version, now);
      checkTicketGrant(context, 'ticket.comentar', row);
      if (['CERRADO', 'CANCELADO'].includes(row.estado)) throw new AppError('TRANSICION_INVALIDA', 409, 'El ticket está cerrado o cancelado.');
      if (data.visibilidad === 'INTERNO') {
        checkTicketGrant(context, 'ticket.comentar_interno', row);
        if (row.idSolicitante === context.usuario.idUsuario) throw new AppError('NO_AUTORIZADO', 403, 'El solicitante no puede escribir notas internas de su caso.');
      }
      await repo.addComment(row.idTicket, data, context, now);
      if (data.visibilidad === 'PUBLICO' && row.estado === 'EN_ATENCION' && row.idAsignado === context.usuario.idUsuario && row.idSolicitante !== context.usuario.idUsuario) {
        await repo.recordFirstResponse(row.idTicket, now);
      }
    });
    return { numero };
  } };
}
