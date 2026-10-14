import { permisoSchema, rolSchema } from '@helpdesk/contracts';
import type { Permiso, Rol } from '@helpdesk/contracts';
import type { SeedTransaction } from './context.js';

const requester: Permiso[] = ['auth.sesion', 'ticket.ver', 'ticket.ver_propios', 'ticket.crear', 'ticket.comentar', 'ticket.adjuntar', 'ticket.cerrar', 'ticket.reabrir', 'ticket.cancelar', 'kb.ver'];
const analyst: Permiso[] = [...requester, 'ticket.asignar', 'ticket.atender', 'ticket.reclasificar', 'ticket.escalar', 'ticket.resolver', 'ticket.comentar_interno', 'activo.ver'];
const permissions: Record<Rol, readonly Permiso[]> = {
  SOLICITANTE: requester,
  ANALISTA_N1: [...analyst, 'ticket.ver_sede', 'ticket.registrar_tercero', 'ticket.ver_notas_internas'],
  ESPECIALISTA_N2: [...analyst, 'ticket.ver_grupo', 'ticket.registrar_tercero', 'ticket.ver_notas_internas', 'sla.pausar', 'sla.reanudar', 'activo.crear', 'activo.editar', 'kb.editar'],
  JEFE_TI: permisoSchema.options,
  AUDITOR: ['auth.sesion', 'ticket.ver', 'ticket.ver_todos', 'ticket.ver_notas_internas', 'activo.ver', 'kb.ver', 'reporte.ver', 'reporte.exportar', 'auditoria.ver', 'auditoria.verificar'],
};

export async function seedPermissions(trx: SeedTransaction) {
  await trx.insertInto('permisos').values(permisoSchema.options.map((codigo, index) => ({
    idPermiso: index + 1, codigo, modulo: codigo.split('.')[0] ?? '', accion: codigo.split('.')[1] ?? '',
  }))).onConflict((conflict) => conflict.column('codigo').doNothing()).execute();
  await trx.insertInto('rolPermiso').values(rolSchema.options.flatMap((rol, index) =>
    permissions[rol].map((codigo) => ({ idRol: index + 1, idPermiso: permisoSchema.options.indexOf(codigo) + 1 })))).execute();
  const transitions: [number, number, Permiso, boolean][] = [
    [1, 2, 'ticket.asignar', false], [1, 9, 'ticket.cancelar', false],
    [2, 3, 'ticket.atender', false], [2, 5, 'ticket.escalar', false],
    [3, 4, 'sla.pausar', false], [3, 5, 'ticket.escalar', false], [3, 6, 'ticket.resolver', false],
    [4, 3, 'sla.reanudar', false], [5, 3, 'ticket.atender', false], [5, 6, 'ticket.resolver', false],
    [6, 7, 'ticket.cerrar', false], [6, 7, 'ticket.cerrar', true], [6, 3, 'ticket.reabrir', false],
    [7, 8, 'ticket.reabrir', false], [8, 3, 'ticket.atender', false],
    [1, 5, 'ticket.escalar', true], [2, 5, 'ticket.escalar', true],
    [1, 2, 'ticket.asignar', true],
    [3, 5, 'ticket.escalar', true], [8, 5, 'ticket.escalar', true],
  ];
  await trx.insertInto('transicionesEstado').values(transitions.map(([idEstadoOrigen, idEstadoDestino, permiso, automatica]) => ({
    idEstadoOrigen, idEstadoDestino, idPermiso: permisoSchema.options.indexOf(permiso) + 1,
    requiereMotivo: [4, 5, 8, 9].includes(idEstadoDestino),
    requiereConfirmacionSolicitante: idEstadoDestino === 7 && !automatica, automatica,
  }))).execute();
}
