import type { Generated, Int8, Json, Timestamp } from './helpers.js';

export interface CorreosEntrantes {
  asunto: string;
  datosSimulados: Json | null;
  estado: string;
  hashContenido: string;
  idCorreo: Generated<Int8>;
  idTicket: number | null;
  idUsuarioRemitente: number | null;
  inReplyTo: string | null;
  messageId: string;
  motivoRechazo: string | null;
  recibidoEn: Timestamp;
  remitente: string;
}
