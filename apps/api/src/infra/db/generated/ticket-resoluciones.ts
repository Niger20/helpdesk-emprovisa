import type { Generated, Timestamp } from './helpers.js';

export interface TicketResoluciones {
  causa: string | null;
  ciclo: number;
  fechaResolucion: Timestamp;
  idResolucion: Generated<number>;
  idResolutor: number;
  idTicket: number;
  solucion: string;
}
