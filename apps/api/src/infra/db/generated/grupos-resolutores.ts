import type { Generated } from './helpers.js';

export interface GruposResolutores {
  activo: boolean;
  correoGrupo: string | null;
  idGrupo: Generated<number>;
  idSede: number | null;
  nivel: number;
  nombre: string;
}
