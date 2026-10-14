import { describe, expect, it } from 'vitest';
import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { knowledgeAccess } from '../knowledge.policies.js';

function session(permissions: Permiso[]): SessionContext {
  return { idSesion: 'demo', csrfToken: '', expiraEn: new Date(), idleMinutes: 30,
    usuario: { idUsuario: 1, username: 'demo', nombreCompleto: 'Usuario demo', sede: { idSede: 1, codigo: 'MGA', nombre: 'Managua' }, roles: [], permisos: permissions },
    grants: permissions.map((codigo) => ({ codigo, idSedeAlcance: null })) };
}
describe('Acceso a conocimientos según permisos de BD', () => {
  it('deniega por defecto y exige grant además del permiso presentado', () => {
    expect(() => knowledgeAccess(null)).toThrow(expect.objectContaining({ code: 'NO_AUTENTICADO' }));
    expect(() => knowledgeAccess(session([]))).toThrow(expect.objectContaining({ code: 'NO_AUTORIZADO' }));
    expect(() => knowledgeAccess({ ...session(['kb.ver']), grants: [] })).toThrow(expect.objectContaining({ code: 'NO_AUTORIZADO' }));
  });
  it('autoservicio no tiene acceso editorial ni interno y soporte solo interno', () => {
    expect(knowledgeAccess(session(['kb.ver']))).toEqual({ editorial: false, internal: false });
    expect(knowledgeAccess(session(['kb.ver', 'ticket.ver_sede']))).toEqual({ editorial: false, internal: true });
  });
  it('auditoría consulta todo sin conceder edición', () => {
    const context = session(['kb.ver', 'auditoria.ver']);
    expect(knowledgeAccess(context)).toEqual({ editorial: true, internal: true });
    expect(() => knowledgeAccess(context, 'kb.editar')).toThrow(expect.objectContaining({ code: 'NO_AUTORIZADO' }));
  });
  it('exige alcance general para escribir artículos sin sede en el ER', () => {
    const context = session(['kb.ver', 'kb.editar']);
    expect(knowledgeAccess(context, 'kb.editar')).toEqual({ editorial: true, internal: true });
    expect(() => knowledgeAccess({ ...context, grants: context.grants.map((grant) => ({ ...grant, idSedeAlcance: 1 })) }, 'kb.editar'))
      .toThrow(expect.objectContaining({ code: 'NO_AUTORIZADO' }));
  });
});
