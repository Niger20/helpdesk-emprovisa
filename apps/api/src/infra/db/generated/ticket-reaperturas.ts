import type { Generated, Timestamp } from './helpers.js';

export interface TicketReaperturas {
  fecha: Timestamp;
  idReapertura: Generated<number>;
  idTicket: number;
  motivo: string;
  nuevoLimiteSolucion: Timestamp;
  solicitadaPor: number;
}
