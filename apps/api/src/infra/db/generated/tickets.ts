import type { Generated, Timestamp } from './helpers.js';

export interface Tickets {
  canalIngreso: string;
  descripcion: string;
  fechaCierre: Timestamp | null;
  fechaCreacion: Timestamp;
  fechaLimiteRespuesta: Timestamp;
  fechaLimiteSolucion: Timestamp;
  fechaPrimeraRespuesta: Timestamp | null;
  fechaResolucion: Timestamp | null;
  idActivo: number | null;
  idAsignado: number | null;
  idCategoria: number;
  idEstado: number;
  idGrupo: number | null;
  idPrioridad: number;
  idRegistradoPor: number;
  idSede: number;
  idSolicitante: number;
  idTicket: Generated<number>;
  idTicketOrigen: number | null;
  impacto: string;
  justificacionPrioridad: string | null;
  minutosPausa: number;
  numero: string;
  numeroReaperturas: number;
  prioridadManual: boolean;
  slaRespuestaCumplido: boolean | null;
  slaSolucionCumplido: boolean | null;
  tipo: string;
  titulo: string;
  urgencia: string;
  version: number;
}
