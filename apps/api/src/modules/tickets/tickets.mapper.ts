import { ticketSchema } from '@helpdesk/contracts';
import type { TicketRow } from './tickets.repository.js';

export function mapTicket(row: TicketRow, porcentajeConsumido: number | null) {
  return ticketSchema.parse({
    numero: row.numero, titulo: row.titulo, descripcion: row.descripcion, tipo: row.tipo,
    estado: row.estado, prioridad: row.prioridad, impacto: row.impacto, urgencia: row.urgencia,
    categoria: row.categoria, solicitante: row.solicitante, sede: row.sede, asignado: row.asignado,
    activo: row.activo, canalIngreso: row.canalIngreso, relojCorre: row.relojCorre, porcentajeConsumido, numeroTicketOrigen: row.numeroTicketOrigen,
    fechaCreacion: row.fechaCreacion.toISOString(), fechaLimiteRespuesta: row.fechaLimiteRespuesta.toISOString(),
    fechaLimiteSolucion: row.fechaLimiteSolucion.toISOString(),
  });
}
