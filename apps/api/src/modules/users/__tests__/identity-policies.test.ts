import { describe, expect, it } from 'vitest';
import { groupInputSchema, membershipSchema, permisoSchema, roleAssignmentSchema, userCreateSchema } from '@helpdesk/contracts';
import type { Permiso } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { assertDelegable, assertIdentitySede, identityScope, protectSelf } from '../users.policies.js';
import { buildIdentitySecurityService } from '../identity-security.service.js';

const context = (codes: Permiso[], sede: number | null = 1): SessionContext => ({ idSesion: '00000000-0000-4000-8000-000000000001', csrfToken: '',
  expiraEn: new Date(), idleMinutes: 30, usuario: { idUsuario: 1, username: 'demo', nombreCompleto: 'Demo',
    sede: { idSede: 1, codigo: 'MGA', nombre: 'Managua' }, roles: [], permisos: codes }, grants: codes.map((codigo) => ({ codigo, idSedeAlcance: sede })) });

describe('Administración: políticas de acceso por permiso', () => {
  it('deniega por defecto sin sesión, sin permiso o sin grant', () => {
    expect(() => identityScope(null, 'usuario.administrar')).toThrow();
    expect(() => identityScope(context([]), 'usuario.administrar')).toThrow();
    expect(() => identityScope({ ...context(['usuario.administrar']), grants: [] }, 'usuario.administrar')).toThrow();
  });
  it('limita por sede y protege el alcance global', () => {
    const scoped = context(['rol.administrar']);
    expect(identityScope(scoped, 'rol.administrar')).toEqual([1]);
    expect(() => assertIdentitySede(scoped, 'rol.administrar', 1)).not.toThrow();
    expect(() => assertIdentitySede(scoped, 'rol.administrar', 2)).toThrow();
    expect(() => assertIdentitySede(scoped, 'rol.administrar', null)).toThrow();
    expect(identityScope(context(['rol.administrar'], null), 'rol.administrar')).toBeNull();
  });
  it('no concede permisos ausentes ni amplía alcance por payload', () => {
    expect(() => assertDelegable(context(['rol.administrar']), ['usuario.administrar'], 1)).toThrow();
    expect(() => assertDelegable(context(['rol.administrar']), ['rol.administrar'], null)).toThrow();
    expect(() => assertDelegable(context(permisoSchema.options, null), ['usuario.administrar'], 2)).not.toThrow();
  });
  it('evita modificar el acceso propio', () => {
    expect(() => protectSelf(context(['usuario.administrar']), 1)).toThrow();
    expect(() => protectSelf(context(['usuario.administrar']), 2)).not.toThrow();
  });
  it('la etiqueta de rol nunca otorga permisos', () => {
    const auditor = context([]); auditor.usuario.roles = [{ codigo: 'JEFE_TI', idSedeAlcance: null }];
    expect(() => identityScope(auditor, 'rol.administrar')).toThrow();
  });
});

describe('Administración: validaciones y última cuenta global', () => {
  it('rechaza vigencias inválidas y payloads adicionales', () => {
    expect(roleAssignmentSchema.safeParse({ idRol: 1, idSedeAlcance: null, vigenteDesde: '2026-10-13', vigenteHasta: '2026-10-12' }).success).toBe(false);
    expect(membershipSchema.safeParse({ idUsuario: 2, esCoordinador: false, desde: '2026-02-30', hasta: null }).success).toBe(false);
    expect(groupInputSchema.safeParse({ nombre: 'Grupo', nivel: 3, idSede: null, correoGrupo: null, activo: true }).success).toBe(false);
    expect(userCreateSchema.safeParse({ nombreCompleto: 'Demo', correo: 'demo@example.invalid', cargo: null, extension: null,
      idSede: 1, idDepartamento: null, idJefeInmediato: null, username: 'demo', password: '123456789012', roles: [4] }).success).toBe(false);
  });
  it('requiere un administrador global vigente después de cambios', async () => {
    const service = (ids: number[]) => buildIdentitySecurityService({ lock: async () => {}, administrators: async () => ids,
      revoke: async () => {}, audit: async () => {} });
    await expect(service([]).ensureAdministrator(new Date())).rejects.toMatchObject({ statusCode: 409 });
    await expect(service([1]).ensureAdministrator(new Date())).resolves.toBeUndefined();
  });
});
