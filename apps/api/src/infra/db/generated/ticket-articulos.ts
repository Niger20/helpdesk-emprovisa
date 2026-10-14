import type { Timestamp } from './helpers.js';

export interface TicketArticulos {
  fecha: Timestamp;
  idArticulo: number;
  idTicket: number;
  uso: string;
  vinculadoPor: number;
}
