import type { Generated, Timestamp } from './helpers.js';

export interface TicketAsignaciones {
  asignadoPor: number | null;
  desde: Timestamp;
  hasta: Timestamp | null;
  idAsignacion: Generated<number>;
  idGrupo: number | null;
  idTicket: number;
  idUsuario: number | null;
  motivo: string | null;
  tipo: string;
}
