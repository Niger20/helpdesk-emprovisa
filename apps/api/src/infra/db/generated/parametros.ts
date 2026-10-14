import type { Timestamp } from './helpers.js';

export interface Parametros {
  clave: string;
  descripcion: string | null;
  modificadoEn: Timestamp;
  modificadoPor: number | null;
  tipoDato: string;
  valor: string;
}
