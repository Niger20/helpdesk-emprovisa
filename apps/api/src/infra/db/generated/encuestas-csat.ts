import type { Generated, Timestamp } from './helpers.js';

export interface EncuestasCsat {
  calificacion: number | null;
  comentario: string | null;
  enviadaEn: Timestamp;
  expiraEn: Timestamp;
  idEncuesta: Generated<number>;
  idTicket: number;
  respondidaEn: Timestamp | null;
  tokenHash: string;
}
