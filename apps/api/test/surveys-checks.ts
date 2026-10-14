import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { surveyDetailSchema, surveyReceiptSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { createSurveyForClosedTicket, createSurveysService, registerSurveysRoutes } from '../src/modules/surveys/index.js';

const endpoint = '/api/v1/encuestas/actual';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
export function surveysChecks(database: Database, env: Env) {
  describe('Encuestas CSAT: cierre, token público y respuesta única', () => {
    let app: FastifyInstance;
    let sequence = 990000;
    const service = createSurveysService(database, env.CSRF_SECRET);
    const fixture = async (now = new Date(), validityDays = 7) => {
      const original = await database.selectFrom('tickets').selectAll().where('idTicket', '=', 7).executeTakeFirstOrThrow();
      const closed = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'CERRADO').executeTakeFirstOrThrow();
      const ticket = await database.insertInto('tickets').values({ ...original, idTicket: undefined, numero: `TK-${++sequence}`,
        idEstado: closed.idEstado, fechaCierre: now }).returning('idTicket').executeTakeFirstOrThrow();
      const survey = await createSurveyForClosedTicket(database, ticket.idTicket, now, validityDays);
      if (!survey) throw new Error('Falta encuesta de prueba.');
      return { ...survey, idTicket: ticket.idTicket };
    };
    beforeEach(async () => {
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET));
      registerSurveysRoutes(app, service);
    });
    afterEach(async () => { await app.close(); });
    it('abre sin sesión, guarda solo SHA-256 y filtra datos internos', async () => {
      const survey = await fixture();
      expect(survey.token).toMatch(/^[a-f0-9]{64}$/);
      expect(survey.enlace).toBe(`/encuesta#${survey.token}`);
      const stored = await database.selectFrom('encuestasCsat').selectAll().where('idTicket', '=', survey.idTicket).executeTakeFirstOrThrow();
      expect(stored.tokenHash).toBe(hash(survey.token));
      expect(stored.tokenHash).not.toBe(survey.token);
      const response = await app.inject({ url: endpoint, headers: { 'x-survey-token': survey.token } });
      expect(response.statusCode).toBe(200);
      expect(surveyDetailSchema.parse(response.json()).numero).toMatch(/^TK-/);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.body).not.toMatch(/idTicket|idSolicitante|correo|tokenHash|comentarios/);
    });
    it('responde una vez y mantiene auditoría encadenada sin token ni comentario', async () => {
      const survey = await fixture();
      const detail = await service.detail(survey.token);
      const payload = { calificacion: 5, comentario: '  Buena atención  ' };
      const headers = { 'x-survey-token': survey.token, 'x-csrf-token': detail.csrfToken };
      const response = await app.inject({ method: 'POST', url: endpoint, payload, headers });
      expect(response.statusCode).toBe(200);
      expect(surveyReceiptSchema.parse(response.json()).calificacion).toBe(5);
      expect((await app.inject({ method: 'POST', url: endpoint, payload, headers })).statusCode).toBe(404);
      expect((await app.inject({ url: endpoint, headers })).statusCode).toBe(404);
      const stored = await database.selectFrom('encuestasCsat').selectAll().where('idTicket', '=', survey.idTicket).executeTakeFirstOrThrow();
      expect(stored.comentario).toBe('Buena atención');
      expect(stored.respondidaEn).toBeInstanceOf(Date);
      const audit = await database.selectFrom('auditoriaSistema').selectAll().where('entidad', '=', 'encuestas_csat')
        .where('idEntidad', '=', String(stored.idEncuesta)).executeTakeFirstOrThrow();
      expect(audit.hashRegistro).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(audit)).not.toContain(survey.token);
      expect(JSON.stringify(audit)).not.toContain('Buena atención');
    });
    it('acepta solo un envío concurrente', async () => {
      const survey = await fixture(); const detail = await service.detail(survey.token);
      const request = { method: 'POST' as const, url: endpoint, payload: { calificacion: 4 },
        headers: { 'x-survey-token': survey.token, 'x-csrf-token': detail.csrfToken } };
      const responses = await Promise.all([app.inject(request), app.inject(request)]);
      expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 404]);
    });
    it('rechaza tokens ausentes, malformados, desconocidos y vencidos incluso en service', async () => {
      expect((await app.inject(endpoint)).statusCode).toBe(400);
      expect((await app.inject({ url: endpoint, headers: { 'x-survey-token': 'malformado' } })).statusCode).toBe(400);
      expect((await app.inject({ url: endpoint, headers: { 'x-survey-token': '0'.repeat(64) } })).statusCode).toBe(404);
      const survey = await fixture(new Date(Date.now() - 8 * 86_400_000));
      expect((await app.inject({ url: endpoint, headers: { 'x-survey-token': survey.token } })).statusCode).toBe(404);
      await expect(service.detail(survey.token)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    });
    it('vence exactamente al límite y rechaza respuesta sin CSRF o con CSRF de otra encuesta', async () => {
      const now = new Date(); const first = await fixture(now); const second = await fixture(now);
      const detail = await service.detail(first.token, now);
      const other = await service.detail(second.token, now);
      await expect(service.detail(first.token, new Date(first.expiraEn))).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
      for (const csrf of [undefined, other.csrfToken]) {
        expect((await app.inject({ method: 'POST', url: endpoint, payload: { calificacion: 3 },
          headers: { 'x-survey-token': first.token, ...(csrf ? { 'x-csrf-token': csrf } : {}) } })).statusCode).toBe(403);
      }
      await expect(service.respond(first.token, { calificacion: 3 }, undefined, now)).rejects.toMatchObject({ code: 'CSRF_INVALIDO' });
      await expect(service.respond(first.token, { calificacion: 3 }, detail.csrfToken, new Date(first.expiraEn)))
        .rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    });
    it('valida escala, entero, longitud y campos ajenos sin consumir el token', async () => {
      const survey = await fixture(); const detail = await service.detail(survey.token);
      const headers = { 'x-survey-token': survey.token, 'x-csrf-token': detail.csrfToken };
      for (const payload of [{ calificacion: 0 }, { calificacion: 6 }, { calificacion: 1.5 },
        { calificacion: '5' }, { calificacion: 3, comentario: 'x'.repeat(501) }, { calificacion: 3, idTicket: 7 }]) {
        expect((await app.inject({ method: 'POST', url: endpoint, payload, headers })).statusCode).toBe(400);
      }
      expect((await app.inject({ method: 'POST', url: endpoint, payload: { calificacion: 1 }, headers })).statusCode).toBe(200);
    });
    it('emisión idempotente, cierre obligatorio y una encuesta también tras reapertura', async () => {
      const survey = await fixture();
      expect(await createSurveyForClosedTicket(database, survey.idTicket)).toBeNull();
      const state = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'REABIERTO').executeTakeFirstOrThrow();
      await database.updateTable('tickets').set({ idEstado: state.idEstado, fechaCierre: null }).where('idTicket', '=', survey.idTicket).execute();
      await expect(service.detail(survey.token)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
      await expect(createSurveyForClosedTicket(database, survey.idTicket)).rejects.toMatchObject({ code: 'TRANSICION_INVALIDA' });
      const closed = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'CERRADO').executeTakeFirstOrThrow();
      await database.updateTable('tickets').set({ idEstado: closed.idEstado, fechaCierre: new Date() }).where('idTicket', '=', survey.idTicket).execute();
      expect(await createSurveyForClosedTicket(database, survey.idTicket)).toBeNull();
    });
    it('emite dentro de la transacción y revierte cuando el cierre falla', async () => {
      const original = await fixture();
      await database.deleteFrom('encuestasCsat').where('idTicket', '=', original.idTicket).execute();
      await expect(database.transaction().execute(async (trx) => {
        expect(await createSurveyForClosedTicket(trx, original.idTicket)).not.toBeNull();
        throw new Error('Revertir cierre de prueba');
      })).rejects.toThrow('Revertir cierre de prueba');
      expect(await database.selectFrom('encuestasCsat').select('idEncuesta').where('idTicket', '=', original.idTicket).executeTakeFirst()).toBeUndefined();
      const issued = await Promise.all([createSurveyForClosedTicket(database, original.idTicket), createSurveyForClosedTicket(database, original.idTicket)]);
      expect(issued.filter(Boolean)).toHaveLength(1);
    });
  });
}
