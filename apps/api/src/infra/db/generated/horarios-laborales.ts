import type { Generated } from './helpers.js';

export interface HorariosLaborales {
  diaSemana: number;
  horaFin: string;
  horaInicio: string;
  idCalendario: number;
  idHorario: Generated<number>;
}
