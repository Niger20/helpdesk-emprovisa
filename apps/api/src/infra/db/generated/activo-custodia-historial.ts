import type { Generated } from './helpers.js';

export interface ActivoCustodiaHistorial {
  actaNumero: string;
  desde: string;
  hasta: string | null;
  idActivo: number;
  idCustodia: Generated<number>;
  idUsuario: number;
  registradoPor: number;
}
