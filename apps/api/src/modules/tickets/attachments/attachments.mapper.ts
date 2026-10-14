import { adjuntoSchema } from '@helpdesk/contracts';
import type { AttachmentsRepository } from './attachments.repository.js';

export function mapAttachment(row: Awaited<ReturnType<AttachmentsRepository['insert']>>) {
  return adjuntoSchema.parse({ idAdjunto: row.idAdjunto, nombreOriginal: row.nombreOriginal,
    mimeType: row.mimeType, tamanoBytes: row.tamanoBytes, fechaSubida: row.fechaSubida.toISOString() });
}
