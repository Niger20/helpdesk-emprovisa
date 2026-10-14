import type { Generated } from './helpers.js';

export interface ActivosTi {
  actaNumero: string;
  codigoPatrimonial: string;
  descripcion: string;
  estado: string;
  fechaAdquisicion: string | null;
  garantiaHasta: string | null;
  idActivo: Generated<number>;
  idCustodio: number | null;
  idSede: number;
  idTipoActivo: number;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
}
