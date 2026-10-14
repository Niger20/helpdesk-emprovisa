import type { Generated, Timestamp } from './helpers.js';

export interface PausasSla {
  aprobadaPor: number | null;
  detalle: string;
  fin: Timestamp | null;
  idPausa: Generated<number>;
  idTicket: number;
  iniciadaPor: number;
  inicio: Timestamp;
  minutosDescontados: number | null;
  motivo: string;
  referenciaExterna: string | null;
}
