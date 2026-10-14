import type { Timestamp } from './helpers.js';

export interface KbVotos {
  comentario: string | null;
  fecha: Timestamp;
  idArticulo: number;
  idUsuario: number;
  util: boolean;
}
