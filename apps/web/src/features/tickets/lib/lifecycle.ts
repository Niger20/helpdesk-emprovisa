import type { TicketLifecycleAction, TicketLifecycleCommand, TicketLifecycleOptions } from '@helpdesk/contracts';

export const lifecycleLabels: Record<TicketLifecycleAction, string> = {
  reclasificar: 'Reclasificar', escalar: 'Escalar a nivel 2', pausar: 'Pausar SLA', reanudar: 'Reanudar SLA',
  resolver: 'Registrar solución', cerrar: 'Confirmar y cerrar', reabrir: 'Reabrir ticket', cancelar: 'Cancelar ticket', rechazar: 'La solución no funcionó',
};
export function initialLifecycleCommand(accion: TicketLifecycleAction, options: TicketLifecycleOptions): TicketLifecycleCommand {
  const base = { version: options.version };
  switch (accion) {
    case 'reclasificar': return { ...base, accion, ...options.actual, prioridad: null, justificacionPrioridad: '' };
    case 'escalar': return { ...base, accion, idGrupoDestino: 0, idUsuarioDestino: null, motivo: '' };
    case 'pausar': return { ...base, accion, motivo: 'REPUESTOS', detalle: '', referenciaExterna: null };
    case 'resolver': return { ...base, accion, causa: null, solucion: '' };
    case 'cerrar': return { ...base, accion, confirmacion: false };
    case 'reanudar': case 'reabrir': case 'cancelar': case 'rechazar': return { ...base, accion, motivo: '' };
  }
}
