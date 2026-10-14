import type { Generated } from './helpers.js';

export interface Feriados {
  descripcion: string;
  fecha: string;
  idCalendario: number;
  idFeriado: Generated<number>;
}
