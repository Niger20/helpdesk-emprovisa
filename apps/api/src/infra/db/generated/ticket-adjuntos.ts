import type { Generated, Timestamp } from './helpers.js';

export interface TicketAdjuntos {
  estadoValidacion: string;
  fechaSubida: Timestamp;
  hashSha256: string;
  idAdjunto: Generated<number>;
  idComentario: number | null;
  idTicket: number;
  mimeType: string;
  nombreAlmacenado: string;
  nombreOriginal: string;
  subidoPor: number;
  tamanoBytes: number;
}
