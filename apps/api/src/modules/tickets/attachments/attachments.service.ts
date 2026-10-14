import { fileTypeFromBuffer } from 'file-type';
import { adjuntoMimeSchema } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import type { AttachmentsRepository } from './attachments.repository.js';
import type { LocalStorage } from '../../../infra/storage/local-storage.js';
import { safeOriginalName } from '../../../infra/storage/local-storage.js';
import { AppError } from '../../../common/errors/app-error.js';
import { requireTicketPermission, ticketScope } from '../index.js';
import { mapAttachment } from './attachments.mapper.js';

function canDownload(context: SessionContext) {
  return context.usuario.permisos.some((permission) => ['ticket.crear', 'ticket.comentar', 'ticket.adjuntar', 'ticket.atender', 'ticket.resolver'].includes(permission));
}
export function buildAttachmentsService(repository: AttachmentsRepository, storage: LocalStorage, transaction: <T>(action: (repo: AttachmentsRepository) => Promise<T>) => Promise<T>) {
  const visible = async (repo: AttachmentsRepository, context: SessionContext | null, numero: string, lock = false) => {
    requireTicketPermission(context, 'ticket.ver');
    const ticket = await repo.ticket(context, numero, lock);
    if (!ticket) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el ticket.');
    return { ticket, internal: ticketScope(context).internal && ticket.idSolicitante !== context.usuario.idUsuario };
  };
  const limit = async (repo = repository) => {
    const maximum = await repo.limit();
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 2147483647) throw new AppError('ERROR_INTERNO', 500, 'El límite de adjuntos no está configurado.');
    return maximum;
  };
  return {
    uploadLimit: async (context: SessionContext | null, numero: string) => {
      requireTicketPermission(context, 'ticket.adjuntar');
      await visible(repository, context, numero); return limit();
    },
    list: async (context: SessionContext | null, numero: string) => {
      const { ticket, internal } = await visible(repository, context, numero);
      requireTicketPermission(context, 'ticket.ver');
      return { data: (await repository.list(ticket.idTicket, internal)).map(mapAttachment), maximoBytes: await limit(), puedeDescargar: canDownload(context) };
    },
    upload: async (context: SessionContext | null, numero: string, name: string, buffer: Buffer) => {
      requireTicketPermission(context, 'ticket.adjuntar');
      let stored: string | undefined;
      try {
        return await transaction(async (repo) => {
          const { ticket } = await visible(repo, context, numero, true);
          if (['CERRADO', 'CANCELADO'].includes(ticket.estado)) throw new AppError('TRANSICION_INVALIDA', 409, 'No podés adjuntar archivos a un caso cerrado o cancelado.');
          if (!buffer.length) throw new AppError('ENTRADA_INVALIDA', 400, 'El archivo está vacío.');
          if (buffer.length > await limit(repo)) throw new AppError('LIMITE_EXCEDIDO', 413, 'El archivo supera el límite permitido.');
          let detected: Awaited<ReturnType<typeof fileTypeFromBuffer>>;
          try { detected = await fileTypeFromBuffer(buffer); } catch { throw new AppError('ENTRADA_INVALIDA', 400, 'No se pudo validar el tipo real del archivo.'); }
          const mime = adjuntoMimeSchema.safeParse(detected?.mime);
          if (!mime.success) throw new AppError('ENTRADA_INVALIDA', 400, 'Solo se admiten archivos JPG, PNG o PDF válidos.');
          const file = await storage.save(buffer); stored = file.nombreAlmacenado;
          return mapAttachment(await repo.insert(ticket.idTicket, context, { ...file, nombreOriginal: safeOriginalName(name), mimeType: mime.data, tamanoBytes: buffer.length }));
        });
      } catch (error) {
        if (stored) await storage.remove(stored);
        throw error;
      }
    },
    download: async (context: SessionContext | null, numero: string, idAdjunto: number) => {
      const { ticket, internal } = await visible(repository, context, numero);
      requireTicketPermission(context, 'ticket.ver');
      if (!canDownload(context)) throw new AppError('NO_AUTORIZADO', 403, 'Tu acceso es de consulta de metadatos y bitácora.');
      const row = await repository.find(ticket.idTicket, internal, idAdjunto);
      if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el adjunto.');
      return { archivo: mapAttachment(row), buffer: await storage.read(row.nombreAlmacenado, row.hashSha256) };
    },
  };
}
export type AttachmentsService = ReturnType<typeof buildAttachmentsService>;
