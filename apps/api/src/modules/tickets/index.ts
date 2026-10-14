export { calcularFechasLimiteSla, sumarMinutosSla, contarMinutosSla } from './domain/sla-calculator.js';
export { evaluarCumplimientoSla } from './domain/sla-compliance.js';
export { calcularLimiteReapertura, puedeReabrirTicket, iniciarCicloReapertura } from './domain/sla-reopening.js';
export type { CalendarioLaboral, HorarioLaboral, PausaSla, PrioridadSla, RelojSla, FechasLimiteSla } from './domain/sla-types.js';
import type { Database } from '../../infra/db/client.js';
import type { DatabaseExecutor } from '../../infra/db/client.js';
import type { SessionContext } from '../auth/index.js';
import { requireTicketPermission, ticketScope } from './tickets.policies.js';
import { AppError } from '../../common/errors/app-error.js';
import { createTicketsRepository, withTicketsTransaction } from './tickets.repository.js';
import { createTicketsService } from './tickets.service.js';
import type { SurveyDelivery } from '../../infra/mail/survey-delivery.js';
export const buildTicketsService = (database: Database, delivery?: SurveyDelivery) => createTicketsService(createTicketsRepository(database), (action) => withTicketsTransaction(database, action), delivery);
export { registerTicketsRoutes } from './tickets.routes.js';
export type { TicketsService } from './tickets.service.js';
export { ticketScope, requireTicketPermission } from './tickets.policies.js';
export type { TicketScope } from './tickets.policies.js';
export { importSimulatedMail } from './mail-import/mail-import.service.js';
export { runAutomaticAssignments, serializeTicketAssignment } from './assignments/automatic-assignment.service.js';

export async function authorizeKnowledgeTicket(database: Database, executor: DatabaseExecutor, context: SessionContext, numero: string, write = false) {
  requireTicketPermission(context, 'ticket.ver');
  if (write) requireTicketPermission(context, 'ticket.atender');
  const repository = createTicketsRepository(database, executor);
  if (write) await repository.lock(numero);
  const row = await repository.find(ticketScope(context), numero, new Date());
  if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El ticket no existe o no está disponible para tu cuenta.');
  if (write && !context.grants.some((grant) => grant.codigo === 'ticket.atender' && (grant.idSedeAlcance === null || grant.idSedeAlcance === row.idSede))) {
    throw new AppError('NO_AUTORIZADO', 403, 'No podés atender tickets de esta sede.');
  }
  if (write && ['CERRADO', 'CANCELADO'].includes(row.estado)) throw new AppError('ENTRADA_INVALIDA', 409, 'El ticket está finalizado.');
  return { idTicket: row.idTicket, numero: row.numero };
}
