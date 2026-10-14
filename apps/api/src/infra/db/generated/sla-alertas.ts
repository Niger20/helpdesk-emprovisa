import type { Generated, Timestamp } from './helpers.js';

export interface SlaAlertas {
  cicloSla: number;
  disparadaEn: Timestamp | null;
  estado: string;
  idAlerta: Generated<number>;
  idTicket: number;
  programadaPara: Timestamp;
  tipo: string;
}
