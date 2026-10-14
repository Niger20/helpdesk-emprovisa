import type { Generated } from './helpers.js';

export interface Categorias {
  activa: boolean;
  idCategoria: Generated<number>;
  idGrupoDefault: number | null;
  idPadre: number | null;
  nombre: string;
  orden: number;
  requiereActivo: boolean;
  tipoAplicable: string;
}
