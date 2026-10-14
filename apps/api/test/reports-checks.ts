import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { reportsSchema, reportsCatalogSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import { createDatabase } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createReportsService, registerReportsRoutes } from '../src/modules/reports/index.js';
import { authenticated } from './auth-http.js';

const range = 'desde=2020-01-01&hasta=2030-12-31';
export function reportsChecks(database: Database, env: Env) {
  describe('Reportes: consulta y exportaciones autorizadas', () => {
    let app: FastifyInstance; let readonly: Database;
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' }).execute();
      readonly = createDatabase(env.DATABASE_READONLY_URL, 3);
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET));
      registerReportsRoutes(app, createReportsService(readonly));
    });
    afterEach(async () => { await app.close(); await readonly.destroy(); });
    it('deniega anónimo y solicitante tanto en rutas como service', async () => {
      expect((await app.inject(`/api/v1/reportes?${range}`)).statusCode).toBe(401);
      const user = await authenticated(app, 'ana.managua');
      expect((await app.inject({ url: `/api/v1/reportes?${range}`, headers: { cookie: user.cookie } })).statusCode).toBe(403);
      const session = await (await createAuthService(database, env.CSRF_SECRET)).load(user.rawToken, new Date());
      await expect(createReportsService(readonly).dashboard(session, { desde: '2020-01-01', hasta: '2030-12-31' })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('jefe y auditor consultan sin exponer tokens ni datos internos; auditor exporta', async () => {
      for (const username of ['admin.emergencia', 'auditor.demo']) {
        const login = await authenticated(app, username); const headers = { cookie: login.cookie };
        const response = await app.inject({ url: `/api/v1/reportes?${range}`, headers });
        expect(response.statusCode).toBe(200); expect(reportsSchema.parse(response.json()).resumen.total).toBeGreaterThan(0);
        expect(response.body).not.toMatch(/tokenHash|passwordHash|comentario|descripcion|correo/);
        expect(reportsCatalogSchema.parse((await app.inject({ url: '/api/v1/reportes/catalogos', headers })).json()).sedes.length).toBeGreaterThan(0);
        const pdf = await app.inject({ url: `/api/v1/reportes/exportar/pdf?${range}`, headers });
        expect(pdf.statusCode).toBe(200); expect(pdf.rawPayload.subarray(0, 5).toString()).toBe('%PDF-');
        const excel = await app.inject({ url: `/api/v1/reportes/exportar/xlsx?${range}`, headers });
        expect(excel.statusCode).toBe(200); expect(excel.headers['content-type']).toContain('spreadsheetml');
        expect(excel.rawPayload.subarray(0, 2).toString()).toBe('PK');
      }
    });
    it('rango vacío, inválido y filtros por sede y categoría', async () => {
      const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
      const empty = await app.inject({ url: '/api/v1/reportes?desde=1900-01-01&hasta=1900-01-01', headers });
      expect(reportsSchema.parse(empty.json()).resumen.total).toBe(0);
      expect((await app.inject({ url: '/api/v1/reportes?desde=2026-02-30&hasta=2026-03-01', headers })).statusCode).toBe(400);
      const filtered = await app.inject({ url: `/api/v1/reportes?${range}&idSede=1&idCategoria=1`, headers });
      const report = reportsSchema.parse(filtered.json()); expect(report.porSede.length).toBeLessThanOrEqual(1); expect(report.porCategoria.length).toBeLessThanOrEqual(1);
    });
    it('aplica alcance de sede de BD en tablero, catálogo y exportaciones', async () => {
      const user = await database.selectFrom('usuarios').select('idUsuario').where('username', '=', 'auditor.demo').executeTakeFirstOrThrow();
      const role = await database.selectFrom('usuarioRol').selectAll().where('idUsuario', '=', user.idUsuario).executeTakeFirstOrThrow();
      await database.updateTable('usuarioRol').set({ idSedeAlcance: 1 }).where('idUsuarioRol', '=', role.idUsuarioRol).execute();
      try {
        const login = await authenticated(app, 'auditor.demo'); const headers = { cookie: login.cookie };
        const catalog = reportsCatalogSchema.parse((await app.inject({ url: '/api/v1/reportes/catalogos', headers })).json());
        expect(catalog.sedes.map((site) => site.idSede)).toEqual([1]);
        expect((await app.inject({ url: `/api/v1/reportes?${range}&idSede=2`, headers })).statusCode).toBe(403);
        expect((await app.inject({ url: `/api/v1/reportes/exportar/xlsx?${range}&idSede=2`, headers })).statusCode).toBe(403);
        const response = reportsSchema.parse((await app.inject({ url: `/api/v1/reportes?${range}`, headers })).json());
        expect(response.porSede.every((site) => site.etiqueta === catalog.sedes[0]?.nombre)).toBe(true);
        const session = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
        if (!session) throw new Error('Falta sesión de reportes.');
        const service = createReportsService(readonly);
        await expect(service.dashboard(session, { desde: '2020-01-01', hasta: '2030-12-31', idSede: 2 })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
        const withoutExport = { ...session, grants: session.grants.filter((grant) => grant.codigo !== 'reporte.exportar') };
        await expect(service.export(withoutExport, { desde: '2020-01-01', hasta: '2030-12-31' }, 'pdf')).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      } finally {
        await database.updateTable('usuarioRol').set({ idSedeAlcance: role.idSedeAlcance }).where('idUsuarioRol', '=', role.idUsuarioRol).execute();
      }
    });
  });
}
