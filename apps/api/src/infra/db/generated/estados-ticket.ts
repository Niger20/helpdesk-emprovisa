import type { Generated } from './helpers.js';

export interface EstadosTicket {
  codigo: string;
  esFinal: boolean;
  idEstado: Generated<number>;
  nombre: string;
  orden: number;
  relojCorre: boolean;
}
