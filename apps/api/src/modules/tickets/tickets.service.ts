import { ticketCreateSchema, ticketQuerySchema, ticketDetailSchema, ticketOptionsSchema } from '@helpdesk/contracts';
import type { TicketCreate, TicketQuery } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import type { TicketsRepository, TicketRow } from './tickets.repository.js';
import { requireTicketPermission, ticketScope, canRegisterFor } from './tickets.policies.js';
import { mapTicket } from './tickets.mapper.js';
import { calcularFechasLimiteSla, contarMinutosSla } from './domain/sla-calculator.js';
import { createAssignmentsService } from './assignments/assignments.service.js';
import { createCommentsService } from './comments/comments.service.js';
import { createLifecycleOptionsService } from './lifecycle/lifecycle-options.service.js';
import { createLifecycleActionsService } from './lifecycle/lifecycle-actions.service.js';
import type { SurveyDelivery } from '../../infra/mail/survey-delivery.js';

export function createTicketsService(repository: TicketsRepository, atomic: <T>(action: (repo: TicketsRepository) => Promise<T>) => Promise<T>, delivery?: SurveyDelivery) {
  const map = async (row: TicketRow, now: Date) => {
    const creation = await repository.cycleStart(row.idTicket, row.fechaCreacion);
    const end = row.fechaResolucion ?? row.fechaCierre ?? now;
    const calendar = await repository.calendar(row.idSede);
    const pauses = await repository.pauses(row.idTicket);
    const used = end >= creation ? contarMinutosSla(creation, end, { calendario: calendar, modoCalendario: row.modoCalendario, pausas: pauses }) : 0;
    return mapTicket(row, used * 100 / row.minutosSolucion);
  };
  return {
    ...createAssignmentsService(repository, atomic),
    ...createCommentsService(atomic),
    lifecycleOptions: createLifecycleOptionsService(repository),
    lifecycle: createLifecycleActionsService(atomic, delivery),
    options: async (context: SessionContext | null) => {
      requireTicketPermission(context, 'ticket.crear');
      return ticketOptionsSchema.parse(await repository.options(context));
    },
    list: async (context: SessionContext | null, input: TicketQuery, now = new Date()) => {
      requireTicketPermission(context, 'ticket.ver');
      const filters = ticketQuerySchema.parse(input);
      const result = await repository.list(ticketScope(context), filters, now);
      return { data: await Promise.all(result.rows.map((row) => map(row, now))), meta: { page: filters.page, pageSize: filters.pageSize, total: result.total } };
    },
    detail: async (context: SessionContext | null, numero: string, now = new Date()) => {
      requireTicketPermission(context, 'ticket.ver');
      const scope = ticketScope(context);
      const row = await repository.find(scope, numero, now);
      if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El ticket no existe o no está disponible para tu cuenta.');
      const internal = scope.internal && row.idSolicitante !== context.usuario.idUsuario;
      const comentarios = await repository.comments(row.idTicket, internal);
      const bitacora = await repository.history(row.idTicket, internal);
      return ticketDetailSchema.parse({ ticket: await map(row, now),
        comentarios: comentarios.map((comment) => ({ ...comment, fechaCreacion: comment.fechaCreacion.toISOString() })),
        bitacora: bitacora.map((event) => ({ ...event, fechaHora: event.fechaHora.toISOString() })),
      });
    },
    create: async (context: SessionContext | null, input: TicketCreate, now = new Date()) => {
      requireTicketPermission(context, 'ticket.crear');
      const data = ticketCreateSchema.parse(input);
      const { numeroTicketOrigen, ...ticketData } = data;
      const numero = await atomic(async (repo) => {
        const requester = await repo.requester(data.idSolicitante);
        if (!requester) throw new AppError('CATALOGO_INVALIDO', 400, 'El solicitante no está activo.');
        canRegisterFor(context, requester.idUsuario, requester.idSede);
        const origin = numeroTicketOrigen ? await repo.find(ticketScope(context), numeroTicketOrigen, now) : undefined;
        if (numeroTicketOrigen && (!origin || origin.estado !== 'CERRADO' || origin.idSolicitante !== requester.idUsuario)) {
          throw new AppError('CATALOGO_INVALIDO', 400, 'El ticket de origen debe estar cerrado y pertenecer al mismo solicitante.');
        }
        if (requester.idUsuario === context.usuario.idUsuario && data.canalIngreso !== 'PORTAL') throw new AppError('ENTRADA_INVALIDA', 400, 'El registro propio usa el portal.');
        if (requester.idUsuario !== context.usuario.idUsuario && !['TELEFONO', 'PRESENCIAL'].includes(data.canalIngreso)) throw new AppError('ENTRADA_INVALIDA', 400, 'Indicá el canal alterno del solicitante.');
        const category = await repo.category(data.idCategoria);
        if (!category || ![data.tipo, 'AMBOS'].includes(category.tipoAplicable)) throw new AppError('CATALOGO_INVALIDO', 400, 'La categoría no corresponde al tipo elegido.');
        if (category.requiereActivo && !data.idActivo) throw new AppError('ACTIVO_REQUERIDO', 400, 'Esta categoría requiere un activo.');
        const idGrupo = await repo.resolverGroup(category.idGrupoDefault, requester.idSede);
        if (idGrupo === undefined) throw new AppError('CATALOGO_INVALIDO', 400, 'No existe un grupo activo del nivel configurado para esta sede.');
        if (data.idActivo) {
          const asset = await repo.asset(data.idActivo);
          if (!asset || asset.idSede !== requester.idSede || asset.estado === 'BAJA') throw new AppError('CATALOGO_INVALIDO', 400, 'El activo no está disponible en la sede del solicitante.');
        }
        const priority = await repo.priority(data.impacto, data.urgencia);
        if (!priority) throw new AppError('CATALOGO_INVALIDO', 400, 'No existe prioridad activa para esa combinación.');
        const limits = calcularFechasLimiteSla(now, priority, await repo.calendar(requester.idSede));
        if (!limits.fechaLimiteRespuesta || !limits.fechaLimiteSolucion) throw new Error('No se calcularon los plazos iniciales.');
        const idTicket = await repo.newId();
        const number = `TK-${String(idTicket).padStart(6, '0')}`;
        const state = await repo.newState();
        await repo.insert({ ...ticketData, idTicket, numero: number, idSolicitante: requester.idUsuario, idTicketOrigen: origin?.idTicket ?? null,
          idRegistradoPor: context.usuario.idUsuario, idSede: requester.idSede, idGrupo,
          idPrioridad: priority.idPrioridad, prioridadManual: false, idEstado: state.idEstado,
          numeroReaperturas: 0, fechaCreacion: now, fechaLimiteRespuesta: limits.fechaLimiteRespuesta,
          fechaLimiteSolucion: limits.fechaLimiteSolucion, minutosPausa: 0, version: 1,
        });
        await repo.logCreation(idTicket, context, now);
        if (limits.fechaAlertaSolucion) await repo.alert(idTicket, 'UMBRAL_50', limits.fechaAlertaSolucion);
        return number;
      });
      return { numero };
    },
  };
}
export type TicketsService = ReturnType<typeof createTicketsService>;
