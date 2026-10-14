import type { Generated, Int8, Timestamp } from './helpers.js';

export interface TicketComentarios {
  contenido: string;
  fechaCreacion: Timestamp;
  idAutor: number | null;
  idComentario: Generated<number>;
  idCorreo: Int8 | null;
  idTicket: number;
  origen: string;
  visibilidad: string;
}
