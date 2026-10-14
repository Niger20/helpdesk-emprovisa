import { describe, expect, it } from 'vitest';
import type { SessionContext } from '../../auth/index.js';
import type { Permiso } from '@helpdesk/contracts';
import { assertAssetSede, assetScope, assetIncidentScope } from '../assets.policies.js';

function context(permisos: Permiso[], grants: SessionContext['grants'] = permisos.map((codigo) => ({ codigo, idSedeAlcance: null }))): SessionContext {
  return { idSesion: '00000000-0000-0000-0000-000000000001', csrfToken: '', expiraEn: new Date(), idleMinutes: 30,
    usuario: { idUsuario: 6, username: 'demo', nombreCompleto: 'Demo', sede: { idSede: 1, codigo: 'MGA', nombre: 'Managua' }, roles: [], permisos }, grants };
}

describe('Políticas CMDB basadas en permisos y grants', () => {
  it('deniega sesión ausente, permisos ausentes y grants incoherentes', () => {
    expect(() => assetScope(null, 'activo.ver')).toThrow('Iniciá sesión');
    expect(() => assetScope(context([]), 'activo.ver')).toThrow('No tenés permiso');
    expect(() => assetScope(context(['activo.ver'], []), 'activo.ver')).toThrow('No tenés permiso');
    expect(() => assetScope(context([], [{ codigo: 'activo.ver', idSedeAlcance: null }]), 'activo.ver')).toThrow('No tenés permiso');
  });
  it('un permiso de consulta global no concede escritura global', () => {
    const session = context(['activo.ver', 'activo.crear'], [{ codigo: 'activo.ver', idSedeAlcance: null }, { codigo: 'activo.crear', idSedeAlcance: 1 }]);
    expect(assetScope(session, 'activo.ver')).toBeNull();
    expect(assetScope(session, 'activo.crear')).toEqual([1]);
    expect(() => assertAssetSede(session, 'activo.crear', 2)).toThrow('No tenés acceso a esta sede');
  });
  it('no amplía visibilidad de incidentes por poder consultar activos', () => {
    expect(assetIncidentScope(context(['activo.ver']))).toMatchObject({ all: false, own: false, group: false, sites: [] });
    expect(assetIncidentScope(context(['activo.ver', 'ticket.ver_todos']))).toMatchObject({ all: false });
    expect(assetIncidentScope(context(['ticket.ver', 'ticket.ver_grupo', 'ticket.ver_propios']))).toMatchObject({ all: false, group: true, own: true });
    expect(assetIncidentScope(context(['ticket.ver', 'ticket.ver_todos']))).toMatchObject({ all: true });
  });
  it('obtiene sedes de tickets de grants específicos, nunca de permisos de activos', () => {
    const session = context(['activo.ver', 'ticket.ver', 'ticket.ver_sede'], [{ codigo: 'activo.ver', idSedeAlcance: 2 },
      { codigo: 'ticket.ver', idSedeAlcance: 1 }, { codigo: 'ticket.ver_sede', idSedeAlcance: 1 }]);
    expect(assetIncidentScope(session).sites).toEqual([1]);
  });
});
