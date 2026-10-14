import type { EstadoActivo } from '@helpdesk/contracts';

export const assetStateLabels: Record<EstadoActivo, string> = { ACTIVO: 'Operativo', MANTENIMIENTO: 'En mantenimiento', BAJA: 'Dado de baja' };
export const assetDate = (date: string | null) => date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : 'No registrada';
export const incidentDate = (date: string) => new Intl.DateTimeFormat('es-NI', {
  timeZone: 'America/Managua', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(date));
