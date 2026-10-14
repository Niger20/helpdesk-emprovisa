import type { Generated, Int8, Timestamp } from './helpers.js';

export interface Notificaciones {
  asunto: string;
  correoDestino: string;
  encoladaEn: Timestamp;
  enviadaEn: Timestamp | null;
  estado: string;
  idBitacora: Int8 | null;
  idDestinatario: number | null;
  idNotificacion: Generated<Int8>;
  idPlantilla: number;
  idTicket: number | null;
  intentos: number;
  proximoIntento: Generated<Timestamp>;
  ultimoError: string | null;
}
