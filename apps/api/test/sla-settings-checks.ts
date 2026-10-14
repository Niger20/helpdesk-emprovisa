import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { slaSettingsSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createSlaSettingsService } from '../src/modules/settings/sla/index.js';
import { createSlaSettingsRepository } from '../src/modules/settings/sla/sla.repository.js';
import { buildSlaSettingsService } from '../src/modules/settings/sla/sla.service.js';
import { authenticated } from './auth-http.js';

export function slaSettingsChecks(database: Database, env: Env) {
  describe('Administración SLA: norma, alcance y metadatos auditados', () => {
    let app: FastifyInstance;
    const service = createSlaSettingsService(database);
    let originals: Awaited<ReturnType<typeof priorities>>;
    const priorities = () => database.selectFrom('prioridadesSla').selectAll().orderBy('codigo').execute();
    beforeEach(async () => {
      originals = await priorities();
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), undefined, undefined, undefined, undefined, { slaSettings: service });
    });
    afterEach(async () => {
      await app.close();
      for (const row of originals) await database.updateTable('prioridadesSla').set({ nombre: row.nombre, minutosRespuesta: row.minutosRespuesta,
        minutosSolucion: row.minutosSolucion, modoCalendario: row.modoCalendario, porcentajeAlerta: row.porcentajeAlerta, activa: row.activa }).where('idPrioridad', '=', row.idPrioridad).execute();
    });
    const loginContext = async () => {
      const login = await authenticated(app); const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      if (!context) throw new Error('Sesión de prueba ausente.');
      return { login, context };
    };
    it('deniega lectura y escritura al anónimo, solicitante y auditor', async () => {
      expect((await app.inject('/api/v1/admin/sla')).statusCode).toBe(401);
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/sla/prioridades/P1', payload: { nombre: 'Crítica', revisionAnterior: '0'.repeat(64) } })).statusCode).toBe(401);
      for (const username of ['ana.managua', 'auditor.demo']) {
        const login = await authenticated(app, username); const headers = { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken };
        expect((await app.inject({ url: '/api/v1/admin/sla', headers })).statusCode).toBe(403);
        expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/sla/prioridades/P1', headers,
          payload: { nombre: 'Crítica', revisionAnterior: '0'.repeat(64) } })).statusCode).toBe(403);
      }
    });
    it('verifica permiso GLOBAL también en service y deniega la sede limitada', async () => {
      const { context } = await loginContext();
      const local = { ...context, grants: [{ codigo: 'parametro.administrar' as const, idSedeAlcance: context.usuario.sede.idSede }] };
      await expect(service.list(null)).rejects.toMatchObject({ statusCode: 401 });
      await expect(service.list(local)).rejects.toMatchObject({ statusCode: 403 });
      await expect(service.edit(local, 'P1', { nombre: 'Crítica', revisionAnterior: '0'.repeat(64) })).rejects.toMatchObject({ statusCode: 403 });
    });
    it('expone cuatro prioridades, nueve combinaciones y plazos normativos', async () => {
      const { login } = await loginContext();
      const response = await app.inject({ url: '/api/v1/admin/sla', headers: { cookie: login.cookie } });
      expect(response.statusCode, response.body).toBe(200);
      const data = slaSettingsSchema.parse(response.json());
      expect(data.cumpleNormativa).toBe(true); expect(data.prioridades).toHaveLength(4); expect(data.matriz).toHaveLength(9);
      expect(data.prioridades.map((row) => [row.codigo, row.minutosRespuesta, row.minutosSolucion, row.modoCalendario, row.porcentajeAlerta]))
        .toEqual([['P1', 15, 120, 'CONTINUO', 50], ['P2', 30, 240, 'CONTINUO', 50], ['P3', 120, 480, 'LABORAL', 50], ['P4', 240, 1440, 'LABORAL', 50]]);
      expect(data.matriz.every((row) => row.prioridad === row.prioridadNormativa)).toBe(true);
    });
    it('exige CSRF y rechaza campos operativos, códigos libres y nombres inválidos', async () => {
      const { login, context } = await loginContext(); const data = await service.list(context);
      const payload = { nombre: 'Prioridad crítica', revisionAnterior: data.revision };
      const url = '/api/v1/admin/sla/prioridades/P1';
      expect((await app.inject({ method: 'PUT', url, headers: { cookie: login.cookie }, payload })).statusCode).toBe(403);
      const headers = { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken };
      for (const extra of [{ minutosRespuesta: 1 }, { minutosSolucion: 1 }, { modoCalendario: 'LABORAL' }, { porcentajeAlerta: 25 }, { activa: false }, { impacto: 'ALTO' }]) {
        expect((await app.inject({ method: 'PUT', url, headers, payload: { ...payload, ...extra } })).statusCode).toBe(400);
      }
      expect((await app.inject({ method: 'PUT', url: '/api/v1/admin/sla/prioridades/P5', headers, payload })).statusCode).toBe(400);
      for (const nombre of ['', ' '.repeat(5), 'x'.repeat(31)]) expect((await app.inject({ method: 'PUT', url, headers, payload: { ...payload, nombre } })).statusCode).toBe(400);
    });
    it('edita solo el nombre con evidencia encadenada y conserva tickets, ciclos y matriz', async () => {
      const { login, context } = await loginContext(); const before = await service.list(context);
      const tickets = () => database.selectFrom('tickets').selectAll().orderBy('idTicket').execute();
      const history = () => database.selectFrom('bitacora').selectAll().orderBy('idBitacora').execute();
      const originalTickets = await tickets(); const originalHistory = await history(); const originalPriorities = await priorities();
      const response = await app.inject({ method: 'PUT', url: '/api/v1/admin/sla/prioridades/P1',
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken }, payload: { nombre: 'Crítica de demostración', revisionAnterior: before.revision } });
      expect(response.statusCode, response.body).toBe(200); const saved = slaSettingsSchema.parse(response.json());
      expect(saved.prioridades.find((row) => row.codigo === 'P1')?.nombre).toBe('Crítica de demostración');
      expect(saved.cumpleNormativa).toBe(true); expect(saved.revision).not.toBe(before.revision); expect(saved.matriz).toEqual(before.matriz);
      expect(await tickets()).toEqual(originalTickets); expect(await history()).toEqual(originalHistory);
      expect(await priorities()).toEqual(originalPriorities.map((row) => row.codigo === 'P1' ? { ...row, nombre: 'Crítica de demostración' } : row));
      const audit = await database.selectFrom('auditoriaSistema').selectAll().where('accion', '=', 'SLA_NOMBRE_EDITADO').orderBy('idAuditoria', 'desc').executeTakeFirstOrThrow();
      expect(audit.hashRegistro).toMatch(/^[a-f0-9]{64}$/); expect(audit.idUsuario).toBe(context.usuario.idUsuario);
      expect(audit.detalle).toEqual({ codigo: 'P1', anterior: before.prioridades.find((row) => row.codigo === 'P1')?.nombre, nuevo: 'Crítica de demostración' });
      expect(audit.idSesion).toBe(context.idSesion); expect(audit.direccionIp).toBe('127.0.0.1');
    });
    it('serializa ediciones concurrentes y rechaza un formulario obsoleto', async () => {
      const { context } = await loginContext(); const before = await service.list(context);
      const results = await Promise.allSettled(['Crítica A', 'Crítica B'].map((nombre) => service.edit(context, 'P1', { nombre, revisionAnterior: before.revision })));
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const failure = results.find((result) => result.status === 'rejected');
      expect(failure?.status === 'rejected' ? failure.reason : null).toMatchObject({ statusCode: 409 });
      await expect(service.edit(context, 'P2', { nombre: 'Alta obsoleta', revisionAnterior: before.revision })).rejects.toMatchObject({ statusCode: 409 });
    });
    it('revierte el nombre si la auditoría falla y evita eventos para un cambio vacío', async () => {
      const { context } = await loginContext(); const before = await service.list(context); const repository = createSlaSettingsRepository(database);
      const failing = buildSlaSettingsService({ atomic: (action) => repository.atomic((repo) => action({ ...repo,
        audit: async () => { throw new Error('Evidencia indisponible'); } })) });
      await expect(failing.edit(context, 'P1', { nombre: 'Cambio revertido', revisionAnterior: before.revision })).rejects.toThrow('Evidencia indisponible');
      expect(await service.list(context)).toEqual(before);
      const auditCount = () => database.selectFrom('auditoriaSistema').select((eb) => eb.fn.countAll().as('total')).where('accion', '=', 'SLA_NOMBRE_EDITADO').executeTakeFirstOrThrow();
      const count = await auditCount(); const first = before.prioridades[0]; if (!first) throw new Error('Prioridad ausente.');
      expect(await service.edit(context, first.codigo, { nombre: first.nombre, revisionAnterior: before.revision })).toEqual(before);
      expect(await auditCount()).toEqual(count);
    });
    it('detecta desvíos de norma sin restaurar ni alterar plazos o ciclos', async () => {
      const { context } = await loginContext();
      await database.updateTable('prioridadesSla').set({ minutosRespuesta: 16 }).where('codigo', '=', 'P1').execute();
      const data = await service.list(context); expect(data.cumpleNormativa).toBe(false);
      expect(data.prioridades.find((row) => row.codigo === 'P1')).toMatchObject({ minutosRespuesta: 16, cumpleNormativa: false, normativa: { minutosRespuesta: 15 } });
      const saved = await service.edit(context, 'P1', { nombre: 'Revisión requerida', revisionAnterior: data.revision });
      expect(saved.prioridades.find((row) => row.codigo === 'P1')?.minutosRespuesta).toBe(16);
    });
  });
}
