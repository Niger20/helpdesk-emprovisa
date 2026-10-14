export interface HorarioLaboral {
  readonly diaSemana: number;
  readonly horaInicio: string;
  readonly horaFin: string;
}

export interface CalendarioLaboral {
  readonly zonaHoraria: string;
  readonly horarios: readonly HorarioLaboral[];
  readonly feriados: readonly string[];
}

export interface PausaSla {
  readonly inicio: Date;
  readonly fin: Date | null;
  readonly motivo: string;
  readonly detalle: string;
}

export interface PrioridadSla {
  readonly minutosRespuesta: number;
  readonly minutosSolucion: number;
  readonly modoCalendario: string;
  readonly porcentajeAlerta: number;
}

export interface RelojSla {
  readonly modoCalendario: string;
  readonly calendario: CalendarioLaboral;
  readonly pausas?: readonly PausaSla[];
}

export interface FechasLimiteSla {
  readonly fechaLimiteRespuesta: Date | null;
  readonly fechaLimiteSolucion: Date | null;
  readonly fechaAlertaRespuesta: Date | null;
  readonly fechaAlertaSolucion: Date | null;
}

export interface IntervaloSla {
  readonly inicio: number;
  readonly fin: number;
}
