import type { Generated } from './helpers.js';

export interface Roles {
  codigo: string;
  descripcion: string | null;
  esSistema: boolean;
  idRol: Generated<number>;
  nombre: string;
}
