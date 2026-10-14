import type { Generated } from './helpers.js';

export interface TransicionesEstado {
  automatica: boolean;
  idEstadoDestino: number;
  idEstadoOrigen: number;
  idPermiso: number;
  idTransicion: Generated<number>;
  requiereConfirmacionSolicitante: boolean;
  requiereMotivo: boolean;
}
