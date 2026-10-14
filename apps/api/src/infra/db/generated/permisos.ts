import type { Generated } from './helpers.js';

export interface Permisos {
  accion: string;
  codigo: string;
  descripcion: string | null;
  idPermiso: Generated<number>;
  modulo: string;
}
