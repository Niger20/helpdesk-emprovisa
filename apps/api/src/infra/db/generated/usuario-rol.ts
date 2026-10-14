import type { Generated } from './helpers.js';

export interface UsuarioRol {
  asignadoPor: number;
  idRol: number;
  idSedeAlcance: number | null;
  idUsuario: number;
  idUsuarioRol: Generated<number>;
  vigenteDesde: string;
  vigenteHasta: string | null;
}
