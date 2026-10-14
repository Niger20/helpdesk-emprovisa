import type { Generated, Timestamp } from './helpers.js';

export interface TareasProgramadas {
  activa: boolean;
  codigo: string;
  expresionCron: string;
  idTarea: Generated<number>;
  ultimaEjecucion: Timestamp | null;
  ultimoResultado: string | null;
}
