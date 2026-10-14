import type { Generated, Timestamp } from './helpers.js';

export interface Delegaciones {
  aprobadaPor: number;
  desde: Timestamp;
  hasta: Timestamp;
  idDelegacion: Generated<number>;
  idDelegado: number;
  idDelegante: number;
  motivo: string;
}
