import type { Generated, Int8, Json, Timestamp } from './helpers.js';

export interface AuditoriaSistema {
  accion: string;
  detalle: Json | null;
  direccionIp: string | null;
  entidad: string;
  fechaHora: Timestamp;
  hashPrevio: string;
  hashRegistro: string;
  idAuditoria: Generated<Int8>;
  idEntidad: string | null;
  idSesion: string | null;
  idTarea: number | null;
  idUsuario: number | null;
  resultado: string;
}
