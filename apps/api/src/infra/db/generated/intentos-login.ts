import type { Generated, Int8, Timestamp } from './helpers.js';

export interface IntentosLogin {
  direccionIp: string;
  exitoso: boolean;
  fechaHora: Timestamp;
  idIntento: Generated<Int8>;
  idUsuario: number | null;
  motivoFallo: string | null;
  usernameIntentado: string;
}
