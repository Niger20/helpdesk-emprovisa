import type { DatabaseExecutor } from '../../infra/db/client.js';
import type { SimulatedMail } from '@helpdesk/contracts';

export function createMailIngestRepository(executor: DatabaseExecutor) {
  return {
    executor,
    sender: (username: string) => executor.selectFrom('usuarios').select(['idUsuario', 'idSede', 'correo']).where('username', '=', username).where('estado', '=', 'ACTIVO').executeTakeFirst(),
    enqueue: (input: SimulatedMail, sender: { idUsuario: number; correo: string }, hash: string, now: Date) => executor.insertInto('correosEntrantes')
      .values({ messageId: input.messageId, inReplyTo: input.inReplyTo, remitente: sender.correo, idUsuarioRemitente: sender.idUsuario,
        asunto: input.solicitud?.titulo ?? 'Respuesta simulada', recibidoEn: now, estado: 'PENDIENTE', hashContenido: hash, datosSimulados: input })
      .onConflict((conflict) => conflict.column('messageId').doNothing()).returning('hashContenido').executeTakeFirst(),
    existing: (messageId: string) => executor.selectFrom('correosEntrantes').select(['hashContenido', 'estado']).where('messageId', '=', messageId).executeTakeFirstOrThrow(),
    pending: () => executor.selectFrom('correosEntrantes').selectAll().where('estado', '=', 'PENDIENTE').where('datosSimulados', 'is not', null)
      .orderBy('recibidoEn').limit(100).forUpdate().skipLocked().execute(),
    thread: (messageId: string) => executor.selectFrom('correosEntrantes').select('idTicket').where('messageId', '=', messageId).where('estado', '=', 'PROCESADO').executeTakeFirst(),
    finish: (idCorreo: string, idTicket: number) => executor.updateTable('correosEntrantes').set({ estado: 'PROCESADO', idTicket, motivoRechazo: null }).where('idCorreo', '=', idCorreo).execute(),
    reject: (idCorreo: string, motivoRechazo: string) => executor.updateTable('correosEntrantes').set({ estado: 'RECHAZADO', motivoRechazo }).where('idCorreo', '=', idCorreo).execute(),
    task: () => executor.selectFrom('tareasProgramadas').select('idTarea').where('codigo', '=', 'mail-ingest').executeTakeFirstOrThrow(),
  };
}
export type MailIngestRepository = ReturnType<typeof createMailIngestRepository>;
