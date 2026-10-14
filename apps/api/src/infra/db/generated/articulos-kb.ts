import type { Generated, Timestamp } from './helpers.js';

export interface ArticulosKb {
  contenido: string;
  estado: string;
  idArticulo: Generated<number>;
  idAutor: number;
  idCategoria: number;
  idRevisor: number | null;
  publicadoEn: Timestamp | null;
  resumen: string | null;
  titulo: string;
  totalVistas: number;
  versionActual: number;
  visibilidad: string;
}
