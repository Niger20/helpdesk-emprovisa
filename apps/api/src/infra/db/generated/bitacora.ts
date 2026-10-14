import type { Generated, Int8, Json, Timestamp } from './helpers.js';

export interface Bitacora {
  accion: string;
  automatica: boolean;
  campoAfectado: string | null;
  direccionIp: string | null;
  fechaHora: Timestamp;
  hashPrevio: string;
  hashRegistro: string;
  idBitacora: Generated<Int8>;
  idSesion: string | null;
  idTarea: number | null;
  idTicket: number;
  idUsuario: number | null;
  valorAnterior: Json | null;
  valorNuevo: Json | null;
}
