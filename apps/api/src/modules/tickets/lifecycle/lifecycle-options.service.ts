import { ticketLifecycleActionSchema, ticketLifecyclePermission, ticketLifecycleOptionsSchema } from '@helpdesk/contracts';
import { DateTime } from 'luxon';
import type { SessionContext } from '../../auth/index.js';
import type { TicketsRepository } from '../tickets.repository.js';
import { requireTicketPermission, ticketScope } from '../tickets.policies.js';
import { calcularLimiteReapertura } from '../domain/sla-reopening.js';
import { AppError } from '../../../common/errors/app-error.js';

export function createLifecycleOptionsService(repository: TicketsRepository) {
  return async (context: SessionContext | null, numero: string, now = new Date()) => {
    requireTicketPermission(context, 'ticket.ver');
    const row = await repository.find(ticketScope(context), numero, now);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'El ticket no está disponible.');
    const own = row.idSolicitante === context.usuario.idUsuario;
    const assigned = row.idAsignado === context.usuario.idUsuario;
    const active = !['RESUELTO', 'CERRADO', 'CANCELADO'].includes(row.estado);
    const deadline = row.estado === 'CERRADO' && row.fechaCierre ? calcularLimiteReapertura(row.fechaCierre, await repository.calendar(row.idSede)) : null;
    const actions = ticketLifecycleActionSchema.options.filter((action) => {
      const permission = ticketLifecyclePermission[action];
      if (!context.usuario.permisos.includes(permission) || !context.grants.some((grant) => grant.codigo === permission
        && (grant.idSedeAlcance === null || grant.idSedeAlcance === row.idSede))) return false;
      switch (action) {
        case 'reclasificar': return active && row.estado !== 'EN_ESPERA';
        case 'escalar': return assigned && ['ASIGNADO', 'EN_ATENCION'].includes(row.estado);
        case 'pausar': return assigned && row.estado === 'EN_ATENCION';
        case 'reanudar': return assigned && row.estado === 'EN_ESPERA';
        case 'resolver': return assigned && !own && ['EN_ATENCION', 'ESCALADO'].includes(row.estado);
        case 'cerrar': return own && !context.usuario.permisos.includes('ticket.resolver') && row.estado === 'RESUELTO';
        case 'cancelar': return own && row.estado === 'NUEVO';
        case 'rechazar': return own && row.estado === 'RESUELTO';
        case 'reabrir': return own && row.estado === 'CERRADO' && deadline !== null && now <= deadline;
      }
    });
    const catalog = actions.includes('reclasificar') ? await repository.lifecycleCatalog(row.idSede, row.tipo) : { categorias: [], activos: [] };
    const groups = actions.includes('escalar') ? await repository.lifecycleGroups(row.idSede) : [];
    const targetGroups = groups.filter((group) => group.idGrupo !== row.idGrupo);
    const availableActions = actions.filter((action) => action !== 'escalar' || targetGroups.length > 0);
    return ticketLifecycleOptionsSchema.parse({ version: row.version, acciones: availableActions, fechaLimiteReapertura: deadline?.toISOString() ?? null,
      requiereTicketNuevo: own && row.estado === 'CERRADO' && deadline !== null && now > deadline,
      ...catalog, grupos: await Promise.all(targetGroups.map(async (group) => ({
        idGrupo: group.idGrupo, nombre: group.nombre, integrantes: await repository.candidates(group.idGrupo, row.idSede,
          DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? ''),
      }))), actual: { idCategoria: row.idCategoria, idActivo: row.idActivo, impacto: row.impacto, urgencia: row.urgencia } });
  };
}
