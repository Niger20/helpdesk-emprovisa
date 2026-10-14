import type { SimulatedMail } from '@helpdesk/contracts';
import type { DatabaseExecutor } from '../../../infra/db/client.js';
import { createTicketWriteRepository } from '../ticket-write.repository.js';
import { createMailImportRepository } from './mail-import.repository.js';
import { calcularFechasLimiteSla } from '../domain/sla-calculator.js';
import { AppError } from '../../../common/errors/app-error.js';

export async function importSimulatedMail(executor: DatabaseExecutor, input: SimulatedMail, idSolicitante: number, idCorreo: string, idTicketThread: number | null, idTarea: number, now: Date) {
  const repo = createTicketWriteRepository(executor);
  const mail = createMailImportRepository(executor);
  const requester = await repo.requester(idSolicitante);
  if (!requester) throw new AppError('CATALOGO_INVALIDO', 400, 'El remitente no está activo.');
  if (input.inReplyTo) {
    const ticket = idTicketThread ? await mail.lock(idTicketThread) : undefined;
    if (!ticket || ticket.idSolicitante !== idSolicitante || ['CERRADO', 'CANCELADO'].includes(ticket.estado)) throw new AppError('NO_AUTORIZADO', 403, 'Hilo no disponible para el solicitante.');
    await mail.reply(ticket.idTicket, idSolicitante, input.contenido, idCorreo, now);
    await mail.log(ticket.idTicket, idTarea, 'COMENTARIO', now);
    return ticket.idTicket;
  }
  const data = input.solicitud;
  if (!data) throw new AppError('ENTRADA_INVALIDA', 400, 'Faltan los datos de clasificación.');
  const category = await repo.category(data.idCategoria);
  if (!category || ![data.tipo, 'AMBOS'].includes(category.tipoAplicable)) throw new AppError('CATALOGO_INVALIDO', 400, 'Categoría inválida.');
  if (category.requiereActivo && !data.idActivo) throw new AppError('ACTIVO_REQUERIDO', 400, 'La categoría requiere un activo.');
  if (data.idActivo) {
    const asset = await repo.asset(data.idActivo);
    if (!asset || asset.idSede !== requester.idSede || asset.estado === 'BAJA') throw new AppError('CATALOGO_INVALIDO', 400, 'Activo no disponible para la sede.');
  }
  const idGrupo = await repo.resolverGroup(category.idGrupoDefault, requester.idSede);
  const priority = await repo.priority(data.impacto, data.urgencia);
  if (idGrupo === undefined || !priority) throw new AppError('CATALOGO_INVALIDO', 400, 'Falta configuración de soporte.');
  const limits = calcularFechasLimiteSla(now, priority, await repo.calendar(requester.idSede));
  if (!limits.fechaLimiteRespuesta || !limits.fechaLimiteSolucion) throw new Error('Plazos iniciales inválidos.');
  const idTicket = await repo.newId();
  await repo.insert({ ...data, descripcion: input.contenido, idTicket, numero: `TK-${String(idTicket).padStart(6, '0')}`, idSolicitante, idRegistradoPor: idSolicitante,
    idSede: requester.idSede, idGrupo, idPrioridad: priority.idPrioridad, prioridadManual: false, idEstado: (await repo.newState()).idEstado,
    canalIngreso: 'CORREO', numeroReaperturas: 0, fechaCreacion: now, fechaLimiteRespuesta: limits.fechaLimiteRespuesta,
    fechaLimiteSolucion: limits.fechaLimiteSolucion, minutosPausa: 0, version: 1 });
  await mail.log(idTicket, idTarea, 'CREACION', now);
  if (limits.fechaAlertaSolucion) await repo.alert(idTicket, 'UMBRAL_50', limits.fechaAlertaSolucion);
  return idTicket;
}
