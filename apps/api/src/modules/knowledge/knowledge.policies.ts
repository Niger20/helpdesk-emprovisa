import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';

export function knowledgeAccess(context: SessionContext | null, permission: 'kb.ver' | 'kb.editar' = 'kb.ver') {
  if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
  const can = (code: Permiso) => context.usuario.permisos.includes(code) && context.grants.some((grant) => grant.codigo === code);
  if (!can('kb.ver') || !can(permission)) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta acción.');
  if (permission === 'kb.editar' && !context.grants.some((grant) => grant.codigo === permission && grant.idSedeAlcance === null)) {
    throw new AppError('NO_AUTORIZADO', 403, 'La edición de conocimientos requiere alcance general.');
  }
  return { editorial: can('kb.editar') || can('auditoria.ver'),
    internal: can('kb.editar') || can('auditoria.ver') || can('ticket.ver_sede') || can('ticket.ver_grupo') || can('ticket.ver_todos') };
}
export type KnowledgeAccess = ReturnType<typeof knowledgeAccess>;
