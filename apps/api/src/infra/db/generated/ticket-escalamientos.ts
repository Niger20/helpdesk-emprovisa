import type { Generated, Timestamp } from './helpers.js';

export interface TicketEscalamientos {
  aceptadoEn: Timestamp | null;
  aceptadoPor: number | null;
  escaladoPor: number | null;
  fecha: Timestamp;
  idEscalamiento: Generated<number>;
  idGrupoDestino: number;
  idTicket: number;
  motivo: string;
  nivelDestino: number;
  nivelOrigen: number;
  tipo: string;
}
