import type { Generated, Timestamp } from './helpers.js';

export interface Usuarios {
  bloqueadoHasta: Timestamp | null;
  cargo: string | null;
  correo: string;
  estado: string;
  extension: string | null;
  guidDirectorio: string | null;
  idDepartamento: number | null;
  idJefeInmediato: number | null;
  idSede: number;
  idUsuario: Generated<number>;
  intentosFallidos: number;
  nombreCompleto: string;
  origenCuenta: string;
  passwordHash: string | null;
  sincronizadoEn: Timestamp | null;
  ultimoAcceso: Timestamp | null;
  username: string;
}
