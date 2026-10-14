import { permisoSchema, ticketAssignSchema, ticketVersionSchema } from '@helpdesk/contracts';
import type { TicketAssign, Permiso } from '@helpdesk/contracts';
import { DateTime } from 'luxon';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { requireTicketPermission, ticketScope } from '../tickets.policies.js';
import { AppError } from '../../../common/errors/app-error.js';
import { validateManualTransition } from '../domain/state-machine.js';

export type TicketAtomic = <T>(action: (repo: TicketsRepository) => Promise<T>) => Promise<T>;
export async function loadTicketForWrite(repo: TicketsRepository, context: SessionContext, numero: string, version: number, now: Date) {
  await repo.lock(numero);
  const row = await repo.find(ticketScope(context), numero, now);
  if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El ticket no existe o no está disponible para tu cuenta.');
  if (row.version !== version) throw new AppError('CONFLICTO_VERSION', 409, 'El ticket cambió. Actualizá la ficha antes de continuar.');
  return row;
}
export function checkTicketGrant(context: SessionContext, codigo: Permiso, row: TicketRow) {
  requireTicketPermission(context, codigo);
  if (!context.grants.some((grant) => grant.codigo === codigo && (grant.idSedeAlcance === null || grant.idSedeAlcance === row.idSede))) {
    throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para operar en esta sede.');
  }
}
export function createAssignmentsService(repository: TicketsRepository, atomic: TicketAtomic) {
  const transition = async (repo: TicketsRepository, row: TicketRow, destino: string, context: SessionContext, motivo: string) => {
    const rule = await repo.transition(row.idEstado, destino);
    validateManualTransition(rule ? { ...rule, codigo: permisoSchema.parse(rule.codigo) } : undefined, context.usuario.permisos, motivo);
    if (!rule) throw new AppError('TRANSICION_INVALIDA', 409, 'Esta transición no está disponible.');
    return rule.idEstadoDestino;
  };
  return {
    operation: async (context: SessionContext | null, numero: string, now = new Date()) => {
      requireTicketPermission(context, 'ticket.ver');
      const row = await repository.find(ticketScope(context), numero, now);
      if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El ticket no está disponible.');
      const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
      const can = (codigo: Parameters<typeof checkTicketGrant>[1]) => context.grants.some((grant) => grant.codigo === codigo
        && context.usuario.permisos.includes(codigo) && (grant.idSedeAlcance === null || grant.idSedeAlcance === row.idSede));
      const active = !['RESUELTO', 'CERRADO', 'CANCELADO'].includes(row.estado);
      const candidatos = active && can('ticket.asignar') ? await repository.candidates(row.idGrupo, row.idSede, date) : [];
      const eligible = candidatos.some((candidate) => candidate.idUsuario === context.usuario.idUsuario);
      return { version: row.version, puedeComentar: !['CERRADO', 'CANCELADO'].includes(row.estado) && can('ticket.comentar'),
        puedeNotaInterna: !['CERRADO', 'CANCELADO'].includes(row.estado) && can('ticket.comentar_interno') && row.idSolicitante !== context.usuario.idUsuario,
        puedeTomar: active && can('ticket.asignar') && row.idAsignado === null && eligible,
        puedeAtender: ['ASIGNADO', 'ESCALADO', 'REABIERTO'].includes(row.estado) && row.idAsignado === context.usuario.idUsuario && can('ticket.atender'),
        puedeReasignar: active && can('ticket.asignar') && can('ticket.reasignar'), candidatos: can('ticket.reasignar') ? candidatos : [] };
    },
    assign: async (context: SessionContext | null, numero: string, input: TicketAssign, now = new Date()) => {
      requireTicketPermission(context, 'ticket.asignar');
      const data = ticketAssignSchema.parse(input);
      await atomic(async (repo) => {
        const row = await loadTicketForWrite(repo, context, numero, data.version, now);
        checkTicketGrant(context, 'ticket.asignar', row);
        if (['RESUELTO', 'CERRADO', 'CANCELADO'].includes(row.estado)) throw new AppError('TRANSICION_INVALIDA', 409, 'No se puede asignar un ticket finalizado.');
        if (row.idAsignado !== null || data.idUsuario !== context.usuario.idUsuario) checkTicketGrant(context, 'ticket.reasignar', row);
        const candidates = await repo.candidates(row.idGrupo, row.idSede, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
        if (!candidates.some((candidate) => candidate.idUsuario === data.idUsuario)) throw new AppError('CATALOGO_INVALIDO', 400, 'El destinatario no pertenece al grupo y alcance activos del ticket.');
        const idEstado = row.estado === 'NUEVO' ? await transition(repo, row, 'ASIGNADO', context, data.motivo) : row.idEstado;
        await repo.assign(row.idTicket, data.idUsuario, row.idGrupo, idEstado, data.motivo, context, now);
        await repo.log(row.idTicket, context, 'ASIGNACION', { idAsignado: row.idAsignado }, { idAsignado: data.idUsuario, motivo: data.motivo }, now);
        if (row.estado === 'NUEVO') await repo.log(row.idTicket, context, 'CAMBIO_ESTADO', { estado: row.estado }, { estado: 'ASIGNADO' }, now);
      });
      return { numero };
    },
    attend: async (context: SessionContext | null, numero: string, input: { version: number }, now = new Date()) => {
      requireTicketPermission(context, 'ticket.atender');
      const data = ticketVersionSchema.parse(input);
      await atomic(async (repo) => {
        const row = await loadTicketForWrite(repo, context, numero, data.version, now);
        checkTicketGrant(context, 'ticket.atender', row);
        if (row.idAsignado !== context.usuario.idUsuario) throw new AppError('NO_AUTORIZADO', 403, 'Solo el responsable asignado puede iniciar atención.');
        if (!['ASIGNADO', 'ESCALADO', 'REABIERTO'].includes(row.estado)) throw new AppError('TRANSICION_INVALIDA', 409, 'El ticket no permite iniciar atención; una pausa requiere reanudación de SLA.');
        const idEstado = await transition(repo, row, 'EN_ATENCION', context, 'Inicio de atención');
        await repo.attend(row.idTicket, idEstado, now, context.usuario.idUsuario);
        await repo.log(row.idTicket, context, 'CAMBIO_ESTADO', { estado: row.estado }, { estado: 'EN_ATENCION' }, now);
      });
      return { numero };
    },
  };
}
