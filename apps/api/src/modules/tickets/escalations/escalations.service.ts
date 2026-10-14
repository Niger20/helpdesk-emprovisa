import { DateTime } from 'luxon';
import type { TicketLifecycleCommand } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository, TicketRow } from '../tickets.repository.js';
import { lifecycleTransition, lifecycleStateLog, assertTicketAssignee } from '../lifecycle/lifecycle.service.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function executeEscalation(repo: TicketsRepository, row: TicketRow, context: SessionContext, input: Extract<TicketLifecycleCommand, { accion: 'escalar' }>, now: Date) {
  assertTicketAssignee(context, row);
  const target = await repo.lifecycleGroup(input.idGrupoDestino);
  const origin = row.idGrupo ? await repo.lifecycleGroup(row.idGrupo) : undefined;
  if (!target || target.nivel !== 2 || (target.idSede !== null && target.idSede !== row.idSede) || target.idGrupo === row.idGrupo) {
    throw new AppError('CATALOGO_INVALIDO', 400, 'Seleccioná un grupo de nivel 2 disponible para esta sede.');
  }
  if (input.idUsuarioDestino !== null) {
    const candidates = await repo.candidates(target.idGrupo, row.idSede, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
    if (!candidates.some((candidate) => candidate.idUsuario === input.idUsuarioDestino)) throw new AppError('CATALOGO_INVALIDO', 400, 'El especialista no pertenece al grupo activo.');
  }
  const idEstado = await lifecycleTransition(repo, row, 'ESCALADO', context, input.motivo);
  await repo.escalateRecord(row.idTicket, target.idGrupo, input.idUsuarioDestino, origin?.nivel ?? 1, input.motivo, context, now);
  await repo.lifecycleUpdate(row.idTicket, { idEstado, idGrupo: target.idGrupo, idAsignado: input.idUsuarioDestino });
  await repo.log(row.idTicket, context, 'ESCALAMIENTO', { idGrupo: row.idGrupo }, { idGrupo: target.idGrupo, motivo: input.motivo }, now);
  await lifecycleStateLog(repo, row, 'ESCALADO', context, now);
}
