import { createHash } from 'node:crypto';
import { simulatedMailSchema, simulatedMailReceiptSchema } from '@helpdesk/contracts';
import type { SimulatedMail } from '@helpdesk/contracts';
import type { MailIngestRepository } from './mail-ingest.repository.js';
import type { SessionContext } from '../auth/index.js';
import { importSimulatedMail, serializeTicketAssignment } from '../tickets/index.js';
import { AppError } from '../../common/errors/app-error.js';

const hashContent = (input: SimulatedMail) => createHash('sha256').update(JSON.stringify(input)).digest('hex');
export function createMailIngestService(repo: MailIngestRepository) {
  return {
    enqueue: async (context: SessionContext | null, input: SimulatedMail, now = new Date()) => {
      if (!context?.grants.some((grant) => grant.codigo === 'parametro.administrar' && grant.idSedeAlcance === null)) throw new AppError('NO_AUTORIZADO', 403, 'Solo la jefatura puede simular la recepción de correo.');
      const data = simulatedMailSchema.parse(input);
      const sender = await repo.sender(data.usernameRemitente);
      if (!sender) throw new AppError('CATALOGO_INVALIDO', 400, 'Elegí una cuenta ficticia activa.');
      const hash = hashContent(data);
      const result = await repo.enqueue(data, sender, hash, now);
      const existing = result ?? await repo.existing(data.messageId);
      if (existing.hashContenido !== hash) throw new AppError('CONFLICTO_VERSION', 409, 'Ese identificador corresponde a otro mensaje.');
      return simulatedMailReceiptSchema.parse({ messageId: data.messageId, estado: 'PENDIENTE', simulada: true });
    },
    ingest: async (now = new Date()) => {
      await serializeTicketAssignment(repo.executor);
      const task = await repo.task();
      for (const row of await repo.pending()) {
        const parsed = simulatedMailSchema.safeParse(row.datosSimulados);
        if (!parsed.success || !row.idUsuarioRemitente || hashContent(parsed.data) !== row.hashContenido) {
          await repo.reject(row.idCorreo, 'Mensaje simulado inválido o alterado'); continue;
        }
        const input = parsed.data;
        const thread = input.inReplyTo ? await repo.thread(input.inReplyTo) : undefined;
        if (input.inReplyTo && !thread?.idTicket) { await repo.reject(row.idCorreo, 'El hilo no existe o no fue procesado'); continue; }
        try {
          const id = await importSimulatedMail(repo.executor, input, row.idUsuarioRemitente, row.idCorreo, thread?.idTicket ?? null, task.idTarea, now);
          await repo.finish(row.idCorreo, id);
        } catch (error) {
          if (!(error instanceof AppError)) throw error;
          await repo.reject(row.idCorreo, 'El remitente o los datos no permiten procesar el requerimiento');
        }
      }
    },
  };
}
