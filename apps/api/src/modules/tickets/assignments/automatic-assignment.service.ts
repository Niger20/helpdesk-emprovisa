import { DateTime } from 'luxon';
import type { DatabaseExecutor } from '../../../infra/db/client.js';
import { createAutomaticAssignmentRepository } from './automatic-assignment.repository.js';
import { selectAutomaticAssignee } from '../domain/automatic-assignment.js';
export async function serializeTicketAssignment(executor: DatabaseExecutor) {
  if (!executor.isTransaction) throw new Error('La selección de responsables requiere una transacción.');
  await createAutomaticAssignmentRepository(executor).serialize();
}

export async function assignTicketAutomatically(executor: DatabaseExecutor, idTicket: number, now: Date) {
  if (!executor.isTransaction) throw new Error('La asignación automática requiere una transacción existente.');
  const repo = createAutomaticAssignmentRepository(executor);
  await repo.serialize();
  const task = await repo.task();
  if (!task.activa) return false;
  const row = await repo.ticket(idTicket);
  if (!row || row.estado !== 'NUEVO' || row.idAsignado !== null || row.idGrupo === null) return false;
  const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
  const target = selectAutomaticAssignee(await repo.candidates(row.idGrupo, row.idCategoria, row.idSede, row.idSolicitante, date));
  if (!target) return false;
  const transition = await repo.transition(row.idEstado);
  if (!transition) throw new Error('Falta la transición automática de asignación.');
  await repo.assign(row.idTicket, transition.idEstado, row.idGrupo, target.idUsuario, now);
  await repo.log(row.idTicket, task.idTarea, 'ASIGNACION', { idAsignado: target.idUsuario, idGrupo: row.idGrupo, criterio: 'ESPECIALIDAD_CARGA', cargaPrevia: target.cargaActiva }, now);
  await repo.log(row.idTicket, task.idTarea, 'CAMBIO_ESTADO', { estado: 'ASIGNADO' }, now);
  return true;
}
export async function runAutomaticAssignments(executor: DatabaseExecutor, now: Date) {
  if (!executor.isTransaction) throw new Error('El procesamiento de cola requiere una transacción.');
  const repo = createAutomaticAssignmentRepository(executor);
  await repo.serialize();
  const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
  for (const row of await repo.pending(date)) await assignTicketAutomatically(executor, row.idTicket, now);
}
