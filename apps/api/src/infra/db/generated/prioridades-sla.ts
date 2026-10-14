import type { Generated } from './helpers.js';

export interface PrioridadesSla {
  activa: boolean;
  codigo: string;
  colorHex: string;
  idPrioridad: Generated<number>;
  minutosRespuesta: number;
  minutosSolucion: number;
  modoCalendario: string;
  nombre: string;
  porcentajeAlerta: number;
}
