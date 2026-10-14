import { prioridadSchema } from '@helpdesk/contracts';
import type { CalendarioLaboral, PausaSla, PrioridadSla } from '../domain/sla-types.js';

export const calendario: CalendarioLaboral = {
  zonaHoraria: 'America/Managua', feriados: [],
  horarios: [1, 2, 3, 4, 5].map((diaSemana) => ({ diaSemana, horaInicio: '08:00:00', horaFin: '17:00:00' })),
};
export const prioridades: Record<string, PrioridadSla> = {
  [prioridadSchema.enum.P1]: { minutosRespuesta: 15, minutosSolucion: 120, modoCalendario: 'CONTINUO', porcentajeAlerta: 50 },
  [prioridadSchema.enum.P2]: { minutosRespuesta: 30, minutosSolucion: 240, modoCalendario: 'CONTINUO', porcentajeAlerta: 50 },
  [prioridadSchema.enum.P3]: { minutosRespuesta: 120, minutosSolucion: 480, modoCalendario: 'LABORAL', porcentajeAlerta: 50 },
  [prioridadSchema.enum.P4]: { minutosRespuesta: 240, minutosSolucion: 1440, modoCalendario: 'LABORAL', porcentajeAlerta: 50 },
};
export function prioridad(codigo: string): PrioridadSla {
  const config = prioridades[codigo];
  if (!config) throw new Error('Fixture de prioridad inexistente.');
  return config;
}
export const fecha = (valor: string) => new Date(`${valor}-06:00`);
export const pausa = (inicio: string, fin: string | null): PausaSla => ({
  inicio: fecha(inicio), fin: fin === null ? null : fecha(fin), motivo: 'REPUESTOS', detalle: 'Esperando repuesto.',
});
