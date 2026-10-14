import type { EstadoTicket } from '@helpdesk/contracts';

export interface TicketScenario {
  numero: string;
  titulo: string;
  solicitante: number;
  sede: number;
  categoria: number;
  activo: number | null;
  prioridad: number;
  antiguedadMinutos: number | null;
  camino: EstadoTicket[];
}

export const scenarios: TicketScenario[] = [
  { numero: 'TK-000001', titulo: 'Cámara de acceso sin imagen en Rivas', solicitante: 3, sede: 2, categoria: 3, activo: 2, prioridad: 1, antiguedadMinutos: 0, camino: ['NUEVO'] },
  { numero: 'TK-000002', titulo: 'Correo de Operaciones no sincroniza', solicitante: 2, sede: 1, categoria: 4, activo: null, prioridad: 2, antiguedadMinutos: 20, camino: ['NUEVO', 'ASIGNADO'] },
  { numero: 'TK-000003', titulo: 'Cámara CCTV con cortes intermitentes', solicitante: 3, sede: 2, categoria: 3, activo: 2, prioridad: 1, antiguedadMinutos: 70, camino: ['NUEVO', 'ASIGNADO', 'EN_ATENCION'] },
  { numero: 'TK-000004', titulo: 'Impresora de Managua espera repuesto', solicitante: 2, sede: 1, categoria: 1, activo: 1, prioridad: 3, antiguedadMinutos: null, camino: ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'EN_ESPERA'] },
  { numero: 'TK-000005', titulo: 'CCTV de Rivas requiere especialista', solicitante: 3, sede: 2, categoria: 3, activo: 2, prioridad: 1, antiguedadMinutos: 150, camino: ['NUEVO', 'ASIGNADO', 'ESCALADO'] },
  { numero: 'TK-000006', titulo: 'Impresora de León recuperó conexión', solicitante: 4, sede: 3, categoria: 1, activo: 3, prioridad: 3, antiguedadMinutos: null, camino: ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'RESUELTO'] },
  { numero: 'TK-000007', titulo: 'Alta de cuenta para nuevo supervisor', solicitante: 2, sede: 1, categoria: 2, activo: null, prioridad: 4, antiguedadMinutos: null, camino: ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'RESUELTO', 'CERRADO'] },
  { numero: 'TK-000008', titulo: 'Falla de CCTV reapareció tras el cierre', solicitante: 3, sede: 2, categoria: 3, activo: 2, prioridad: 1, antiguedadMinutos: null, camino: ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'RESUELTO', 'CERRADO', 'REABIERTO'] },
  { numero: 'TK-000009', titulo: 'Solicitud duplicada de correo corporativo', solicitante: 4, sede: 3, categoria: 4, activo: null, prioridad: 3, antiguedadMinutos: null, camino: ['NUEVO', 'CANCELADO'] },
];
