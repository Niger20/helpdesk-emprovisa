import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { assetCreateSchema, assetDetailSchema, assetListSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createAssetsService, registerAssetsRoutes } from '../src/modules/assets/index.js';
import { authenticated } from './auth-http.js';

const input = (codigoPatrimonial: string) => assetCreateSchema.parse({ codigoPatrimonial, idTipoActivo: 1, marca: 'HP', modelo: 'Demo',
  numeroSerie: 'DEMO-TEST', descripcion: 'Activo de integración', idSede: 1, idCustodio: 2, estado: 'ACTIVO', actaNumero: 'F-ACT-01-TEST',
  fechaAdquisicion: '2026-10-01', garantiaHasta: '2027-10-01' });

export function assetsChecks(database: Database, env: Env) {
  describe('CMDB: consulta, alta, alcance y trazabilidad', () => {
    let app: FastifyInstance;
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' }).execute();
      const auth = await createAuthService(database, env.CSRF_SECRET);
      app = await buildApp(env, async () => true, auth);
      registerAssetsRoutes(app, createAssetsService(database));
    });
    afterEach(async () => { await app.close(); });
    it('exige sesión y deniega la consulta al solicitante', async () => {
      expect((await app.inject('/api/v1/activos')).statusCode).toBe(401);
      const login = await authenticated(app, 'ana.managua');
      expect((await app.inject({ url: '/api/v1/activos', headers: { cookie: login.cookie } })).statusCode).toBe(403);
    });
    it('lista solo la sede autorizada y deniega acceder a otra sede', async () => {
      const login = await authenticated(app, 'analista.managua');
      const response = await app.inject({ url: '/api/v1/activos?pageSize=1&q=EMP', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      const list = assetListSchema.parse(response.json());
      expect(list.data).toHaveLength(1);
      expect(list.data.every((asset) => asset.sede.idSede === 1)).toBe(true);
      expect((await app.inject({ url: '/api/v1/activos/EMP-CAM-0031', headers: { cookie: login.cookie } })).statusCode).toBe(403);
      expect((await app.inject({ url: '/api/v1/activos?idSede=2', headers: { cookie: login.cookie } })).statusCode).toBe(403);
    });
    it('auditor consulta ficha y custodia, pero no puede crear', async () => {
      const login = await authenticated(app, 'auditor.demo');
      const response = await app.inject({ url: '/api/v1/activos/EMP-IMP-0142', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      expect(assetDetailSchema.parse(response.json()).custodiaHistorial.length).toBeGreaterThan(0);
      expect(response.body).not.toMatch(/passwordHash|correo|tokenHash/);
      expect((await app.inject({ method: 'POST', url: '/api/v1/activos', payload: input('EMP-TEST-AUDITOR'),
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } })).statusCode).toBe(403);
    });
    it('historial del N2 muestra solo incidentes asignados o de sus grupos vigentes', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const response = await app.inject({ url: '/api/v1/activos/EMP-CAM-0031', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      const incidents = assetDetailSchema.parse(response.json()).incidentes.map((incident) => incident.numero);
      expect(incidents).toEqual(expect.arrayContaining(['TK-000005', 'TK-000008']));
      expect(incidents).not.toContain('TK-000001');
      expect(incidents).not.toContain('TK-000003');
    });
    it('los caracteres de comodín se buscan literalmente', async () => {
      const login = await authenticated(app, 'auditor.demo');
      const response = await app.inject({ url: '/api/v1/activos?q=%25', headers: { cookie: login.cookie } });
      expect(response.statusCode).toBe(200);
      expect(assetListSchema.parse(response.json()).data).toHaveLength(0);
    });
    it('crea activo, custodia y auditoría en una transacción y rechaza duplicados', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const request = { method: 'POST' as const, url: '/api/v1/activos', payload: input('EMP-TEST-ALTA'),
        headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } };
      const response = await app.inject(request);
      expect(response.statusCode).toBe(201);
      const asset = assetDetailSchema.parse(response.json());
      expect(asset.custodiaHistorial).toHaveLength(1);
      expect(asset.custodiaHistorial[0]).toMatchObject({ actaNumero: 'F-ACT-01-TEST', custodio: 'Ana López (demo)' });
      const audit = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'activos_ti')
        .where('idEntidad', '=', String(asset.idActivo)).execute();
      expect(audit).toHaveLength(1);
      expect(audit[0]?.hashRegistro).toMatch(/^[a-f0-9]{64}$/);
      expect((await app.inject(request)).statusCode).toBe(409);
      expect((await database.selectFrom('activoCustodiaHistorial').selectAll().where('idActivo', '=', asset.idActivo).execute())).toHaveLength(1);
    });
    it('rechaza CSRF ausente, datos inválidos y referencias inexistentes sin insertar', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const payload = input('EMP-TEST-INVALIDO');
      expect((await app.inject({ method: 'POST', url: '/api/v1/activos', payload, headers: { cookie: login.cookie } })).statusCode).toBe(403);
      for (const invalid of [{ ...payload, actaNumero: '' }, { ...payload, garantiaHasta: '2025-01-01' }, { ...payload, idCustodio: 999999 }]) {
        const response = await app.inject({ method: 'POST', url: '/api/v1/activos', payload: invalid,
          headers: { cookie: login.cookie, 'x-csrf-token': login.session.csrfToken } });
        expect(response.statusCode).toBe(400);
      }
      expect(await database.selectFrom('activosTi').select('idActivo').where('codigoPatrimonial', '=', payload.codigoPatrimonial).executeTakeFirst()).toBeUndefined();
    });
    it('aplica permisos también al invocar el service directamente', async () => {
      const service = createAssetsService(database);
      const auth = await createAuthService(database, env.CSRF_SECRET);
      const login = await authenticated(app, 'auditor.demo');
      const context = await auth.load(login.rawToken, new Date());
      await expect(service.create(context, input('EMP-TEST-SERVICE'))).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('revierte activo y custodia cuando la auditoría falla', async () => {
      const login = await authenticated(app, 'especialista.infra');
      const auth = await createAuthService(database, env.CSRF_SECRET);
      const context = await auth.load(login.rawToken, new Date());
      if (!context) throw new Error('Falta la sesión de prueba.');
      const previous = await database.selectFrom('activoCustodiaHistorial').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      await expect(createAssetsService(database).create({ ...context, idSesion: '00000000-0000-0000-0000-000000000000' }, input('EMP-TEST-ROLLBACK')))
        .rejects.toMatchObject({ code: '23503' });
      expect(await database.selectFrom('activosTi').select('idActivo').where('codigoPatrimonial', '=', 'EMP-TEST-ROLLBACK').executeTakeFirst()).toBeUndefined();
      const next = await database.selectFrom('activoCustodiaHistorial').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      expect(next.total).toBe(previous.total);
    });
  });
}
