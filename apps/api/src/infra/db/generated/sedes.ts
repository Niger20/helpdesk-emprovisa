import type { Generated } from './helpers.js';

export interface Sedes {
  activa: boolean;
  ciudad: string;
  codigo: string;
  direccion: string | null;
  idCalendario: number;
  idSede: Generated<number>;
  nombre: string;
}
