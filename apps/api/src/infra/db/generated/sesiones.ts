import type { Timestamp } from './helpers.js';

export interface Sesiones {
  creadaEn: Timestamp;
  direccionIp: string;
  expiraEn: Timestamp;
  idSesion: string;
  idUsuario: number;
  motivoRevocacion: string | null;
  revocadaEn: Timestamp | null;
  tokenHash: string;
  ultimaActividad: Timestamp;
  userAgent: string | null;
}
