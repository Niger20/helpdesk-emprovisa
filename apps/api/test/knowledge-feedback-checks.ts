import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { knowledgeCreateSchema, knowledgeFeedbackSchema, knowledgeLinksSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createKnowledgeService, registerKnowledgeRoutes } from '../src/modules/knowledge/index.js';
import { authenticated } from './auth-http.js';

export function knowledgeFeedbackChecks(database: Database, env: Env) {
  describe('Conocimientos: utilidad y vínculos privados', () => {
    let app: FastifyInstance;
    let id: number;
    const url = () => `/api/v1/conocimientos/${id}`;
    const headers = (login: Awaited<ReturnType<typeof authenticated>>) => ({ cookie: login.cookie, 'x-csrf-token': login.session.csrfToken });
    const context = async (login: Awaited<ReturnType<typeof authenticated>>) => {
      const result = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      if (!result) throw new Error('Falta la sesión de prueba.');
      return result;
    };
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO' }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET));
      registerKnowledgeRoutes(app, createKnowledgeService(database));
      const editor = await authenticated(app, 'especialista.infra');
      id = (await createKnowledgeService(database).create(await context(editor), knowledgeCreateSchema.parse({ titulo: 'Artículo para utilidad y vínculos',
        resumen: null, contenido: 'Procedimiento ficticio de pruebas locales.', idCategoria: 1, estado: 'PUBLICADO', visibilidad: 'PUBLICO', motivoCambio: 'Prueba local' }))).idArticulo;
    });
    afterEach(async () => { await app.close(); });
    it('exige sesión, CSRF y escritura; auditor no vota ni vincula en ruta o servicio', async () => {
      expect((await app.inject(`${url()}/utilidad`)).statusCode).toBe(401);
      const reader = await authenticated(app, 'ana.managua');
      expect((await app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload: { util: true, comentario: null }, headers: { cookie: reader.cookie } })).statusCode).toBe(403);
      const auditor = await authenticated(app, 'auditor.demo');
      const service = createKnowledgeService(database);
      expect((await app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload: { util: true, comentario: null }, headers: headers(auditor) })).statusCode).toBe(403);
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload: { numero: 'TK-000002', uso: 'consulta' }, headers: headers(auditor) })).statusCode).toBe(403);
      await expect(service.vote(await context(auditor), id, { util: true, comentario: null })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      await expect(service.link(await context(auditor), id, { numero: 'TK-000002', uso: 'consulta' })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    });
    it('serializa votos repetidos/concurrentes; permite actualizar sin duplicar ni divulgar comentarios', async () => {
      const reader = await authenticated(app, 'ana.managua');
      const payload = { util: true, comentario: 'Comentario privado de prueba' };
      const responses = await Promise.all([1, 2, 3].map(() => app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload, headers: headers(reader) })));
      expect(responses.every((response) => response.statusCode === 200)).toBe(true);
      expect(responses.filter((response) => response.json<{ actualizado: boolean }>().actualizado)).toHaveLength(1);
      const votes = await database.selectFrom('kbVotos').selectAll().where('idArticulo', '=', id).execute();
      expect(votes).toHaveLength(1);
      const other = await authenticated(app, 'carlos.rivas');
      const response = await app.inject({ url: `${url()}/utilidad`, headers: headers(other) });
      expect(knowledgeFeedbackSchema.parse(response.json())).toEqual({ utiles: 1, noUtiles: 0, miVoto: null });
      expect(response.body).not.toContain(payload.comentario);
      await app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload: { util: false, comentario: null }, headers: headers(reader) });
      const updated = await app.inject({ url: `${url()}/utilidad`, headers: headers(reader) });
      expect(knowledgeFeedbackSchema.parse(updated.json())).toEqual({ utiles: 0, noUtiles: 1, miVoto: { util: false, comentario: null } });
      const audit = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'kb_votos').where('idEntidad', '=', String(id)).execute();
      expect(audit).toHaveLength(2);
      expect(JSON.stringify(audit)).not.toContain(payload.comentario);
      expect(audit.every((row) => /^[a-f0-9]{64}$/.test(row.hashRegistro))).toBe(true);
    });
    it('vincula dentro de sede, rechaza otros alcances y oculta tickets ajenos', async () => {
      const analyst = await authenticated(app, 'analista.managua');
      const payload = { numero: 'TK-000002', uso: 'consulta' };
      const results = await Promise.all([1, 2].map(() => app.inject({ method: 'PUT', url: `${url()}/tickets`, payload, headers: headers(analyst) })));
      expect(results.every((result) => result.statusCode === 200)).toBe(true);
      expect(results.filter((result) => result.json<{ actualizado: boolean }>().actualizado)).toHaveLength(1);
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload, headers: headers(analyst) })).json()).toEqual({ actualizado: false });
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload: { ...payload, numero: 'TK-000001' }, headers: headers(analyst) })).statusCode).toBe(404);
      const owner = await authenticated(app, 'ana.managua');
      const foreign = await authenticated(app, 'carlos.rivas');
      const own = await app.inject({ url: `${url()}/tickets`, headers: headers(owner) });
      expect(knowledgeLinksSchema.parse(own.json()).data.map((row) => row.numero)).toEqual([payload.numero]);
      expect(own.body).not.toMatch(/idTicket|solicitante|contenido|comentario|correo/);
      const hidden = await app.inject({ url: `${url()}/tickets`, headers: headers(foreign) });
      expect(knowledgeLinksSchema.parse(hidden.json()).data).toEqual([]);
      expect((await app.inject({ method: 'DELETE', url: `${url()}/tickets/${payload.numero}`, headers: headers(owner) })).statusCode).toBe(403);
      expect((await app.inject({ method: 'DELETE', url: `${url()}/tickets/${payload.numero}`, headers: headers(analyst) })).json()).toEqual({ actualizado: true });
      expect((await app.inject({ method: 'DELETE', url: `${url()}/tickets/${payload.numero}`, headers: headers(analyst) })).json()).toEqual({ actualizado: false });
      const events = await database.selectFrom('bitacora').select(['accion', 'hashRegistro']).where('campoAfectado', '=', 'ticket_articulos')
        .where('valorNuevo', '@>', JSON.stringify({ idArticulo: id })).execute();
      expect(events.map((event) => event.accion).sort()).toEqual(['KB_DESVINCULADO', 'KB_VINCULADO']);
      expect(events.every((event) => /^[a-f0-9]{64}$/.test(event.hashRegistro))).toBe(true);
    });
    it('N2 solo vincula y consulta tickets de su grupo vigente', async () => {
      const specialist = await authenticated(app, 'especialista.infra');
      const service = createKnowledgeService(database);
      const session = await context(specialist);
      const ticket = await database.selectFrom('tickets').select(['numero', 'idAsignado']).where('idGrupo', '=', 2)
        .where('numero', '!=', 'TK-000007').executeTakeFirstOrThrow();
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload: { numero: ticket.numero, uso: 'SOLUCION' }, headers: headers(specialist) })).statusCode).toBe(200);
      const userId = session.usuario.idUsuario;
      const original = await database.selectFrom('grupoMiembros').selectAll().where('idUsuario', '=', userId).where('idGrupo', '=', 2).executeTakeFirstOrThrow();
      await database.updateTable('grupoMiembros').set({ hasta: '2000-01-01' }).where('idUsuario', '=', userId).where('idGrupo', '=', 2).execute();
      try {
        await database.updateTable('tickets').set({ idAsignado: null }).where('numero', '=', ticket.numero).execute();
        expect((await service.links(session, id)).data).toEqual([]);
        await expect(service.link(session, id, { numero: ticket.numero, uso: 'consulta' })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
      } finally {
        await database.updateTable('grupoMiembros').set({ hasta: original.hasta }).where('idUsuario', '=', userId).where('idGrupo', '=', 2).execute();
        await database.updateTable('tickets').set({ idAsignado: ticket.idAsignado }).where('numero', '=', ticket.numero).execute();
      }
    });
    it('rechaza artículos ocultos, borradores, tickets finalizados y datos fuera del ER', async () => {
      const editor = await authenticated(app, 'especialista.infra');
      const reader = await authenticated(app, 'ana.managua');
      const analyst = await authenticated(app, 'analista.managua');
      await database.updateTable('articulosKb').set({ visibilidad: 'INTERNO' }).where('idArticulo', '=', id).execute();
      expect((await app.inject({ url: `${url()}/utilidad`, headers: headers(reader) })).statusCode).toBe(404);
      expect((await app.inject({ url: `${url()}/tickets`, headers: headers(reader) })).statusCode).toBe(404);
      await database.updateTable('articulosKb').set({ estado: 'BORRADOR' }).where('idArticulo', '=', id).execute();
      expect((await app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload: { util: true, comentario: null }, headers: headers(editor) })).statusCode).toBe(409);
      await database.updateTable('articulosKb').set({ estado: 'PUBLICADO', visibilidad: 'PUBLICO' }).where('idArticulo', '=', id).execute();
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload: { numero: 'TK-000007', uso: 'consulta' }, headers: headers(analyst) })).statusCode).toBe(409);
      expect((await app.inject({ method: 'PUT', url: `${url()}/utilidad`, payload: { util: 5, comentario: null }, headers: headers(reader) })).statusCode).toBe(400);
      expect((await app.inject({ method: 'PUT', url: `${url()}/tickets`, payload: { numero: 'TK-000002', uso: 'a'.repeat(11) }, headers: headers(analyst) })).statusCode).toBe(400);
    });
    it('revierte votos y vínculos cuando falla la auditoría', async () => {
      const reader = await authenticated(app, 'ana.managua');
      const analyst = await authenticated(app, 'analista.managua');
      const service = createKnowledgeService(database);
      const invalid = { idSesion: '00000000-0000-0000-0000-000000000000' };
      await expect(service.vote({ ...await context(reader), ...invalid }, id, { util: true, comentario: null })).rejects.toMatchObject({ code: '23503' });
      expect(await database.selectFrom('kbVotos').selectAll().where('idArticulo', '=', id).execute()).toEqual([]);
      await expect(service.link({ ...await context(analyst), ...invalid }, id, { numero: 'TK-000002', uso: 'consulta' })).rejects.toMatchObject({ code: '23503' });
      expect(await database.selectFrom('ticketArticulos').selectAll().where('idArticulo', '=', id).execute()).toEqual([]);
    });
  });
}
