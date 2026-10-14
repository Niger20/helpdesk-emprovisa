import { z } from 'zod';

export const permisoSchema = z.enum([
  'auth.sesion',
  'ticket.ver_propios', 'ticket.ver_sede', 'ticket.ver_grupo', 'ticket.ver_todos', 'ticket.registrar_tercero', 'ticket.ver_notas_internas',
  'ticket.ver', 'ticket.crear', 'ticket.comentar', 'ticket.adjuntar',
  'ticket.asignar', 'ticket.atender', 'ticket.reclasificar', 'ticket.escalar', 'ticket.resolver',
  'ticket.cerrar', 'ticket.reabrir', 'ticket.cancelar', 'sla.pausar', 'sla.reanudar',
  'activo.ver', 'activo.crear', 'activo.editar', 'kb.ver', 'kb.editar',
  'reporte.ver', 'reporte.exportar', 'auditoria.ver', 'auditoria.verificar',
  'usuario.administrar', 'rol.administrar', 'parametro.administrar',
  'ticket.reasignar', 'ticket.comentar_interno',
]);
export type Permiso = z.infer<typeof permisoSchema>;
