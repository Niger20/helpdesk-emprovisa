import type { Generated, Timestamp } from './helpers.js';

export interface ArticulosKbVersiones {
  contenido: string;
  editadoPor: number;
  fechaEdicion: Timestamp;
  idArticulo: number;
  idVersion: Generated<number>;
  motivoCambio: string | null;
  numeroVersion: number;
  titulo: string;
}
