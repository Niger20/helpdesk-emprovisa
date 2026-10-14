import { describe, expect, it, vi } from 'vitest';
import { surveyResponseSchema } from '@helpdesk/contracts';
import { csrfToken } from '../../../common/crypto/session-tokens.js';
import { buildSurveysService, issueSurvey } from '../surveys.service.js';
import type { SurveysRepository } from '../surveys.repository.js';

const now = new Date('2026-10-14T00:00:00Z');
const secret = 'secreto-ficticio-para-pruebas-csat';
const token = '1'.repeat(64);
const row = { numero: 'TK-000007', titulo: 'Caso de prueba', atendidoPor: null, fechaCierre: now,
  expiraEn: new Date(now.getTime() + 86400000), respondidaEn: null, codigo: 'CERRADO' };
function repository(): SurveysRepository {
  const queries = { find: vi.fn(async () => row), answer: vi.fn(async () => ({ idEncuesta: 1, idTicket: 7 })),
    auditResponse: vi.fn(async () => undefined), existing: vi.fn(async () => undefined),
    insert: vi.fn(async () => undefined), lockTicket: vi.fn(async () => ({ idTicket: 7, codigo: 'CERRADO' })) };
  return { ...queries, atomic: (action) => action(queries) };
}
describe('CSAT: validación y seguridad del servicio', () => {
  it('calificación 1–5 entera, comentario opcional y máximo 500', () => {
    expect(surveyResponseSchema.parse({ calificacion: 1 })).toEqual({ calificacion: 1 });
    expect(surveyResponseSchema.parse({ calificacion: 5, comentario: '  Bien  ' }).comentario).toBe('Bien');
    for (const calificacion of [0, 6, 1.5, '5', null]) expect(surveyResponseSchema.safeParse({ calificacion }).success).toBe(false);
    expect(surveyResponseSchema.safeParse({ calificacion: 3, comentario: 'x'.repeat(501) }).success).toBe(false);
    expect(surveyResponseSchema.safeParse({ calificacion: 3, idTicket: 7 }).success).toBe(false);
  });
  it('emite 32 bytes aleatorios, guarda hash y limita vigencia', async () => {
    const repo = repository(); const issued = await issueSurvey(repo, 7, now);
    expect(issued?.token).toMatch(/^[a-f0-9]{64}$/);
    expect(issued?.expiraEn).toBe('2026-10-21T00:00:00.000Z');
    expect(repo.insert).toHaveBeenCalledWith(7, expect.stringMatching(/^[a-f0-9]{64}$/), now, new Date('2026-10-21T00:00:00Z'));
    expect(vi.mocked(repo.insert).mock.calls[0]?.[1]).not.toBe(issued?.token);
    await expect(issueSurvey(repo, 0, now)).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(issueSurvey(repo, 7, now, 0)).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(issueSurvey(repo, 7, now, 366)).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
  });
  it('solo emite tras cierre y no reemite encuestas existentes', async () => {
    const repo = repository();
    vi.mocked(repo.lockTicket).mockResolvedValueOnce({ idTicket: 7, codigo: 'RESUELTO' });
    await expect(issueSurvey(repo, 7, now)).rejects.toMatchObject({ code: 'TRANSICION_INVALIDA' });
    vi.mocked(repo.existing).mockResolvedValueOnce({ idEncuesta: 1 });
    expect(await issueSurvey(repo, 7, now)).toBeNull();
    expect(repo.insert).not.toHaveBeenCalled();
  });
  it('filtra DTO y rechaza vencimiento exacto, respuesta previa y reapertura', async () => {
    const repo = repository(); const service = buildSurveysService(repo, secret);
    expect(Object.keys(await service.detail(token, now)).sort()).toEqual(['atendidoPor', 'csrfToken', 'expiraEn', 'fechaCierre', 'numero', 'titulo']);
    for (const unavailable of [{ ...row, expiraEn: now }, { ...row, respondidaEn: now }, { ...row, codigo: 'REABIERTO' }]) {
      vi.mocked(repo.find).mockResolvedValueOnce(unavailable);
      await expect(service.detail(token, now)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    }
    await expect(service.detail('token-invalido', now)).rejects.toThrow();
  });
  it('verifica CSRF en service y audita solo la respuesta ganadora', async () => {
    const repo = repository(); const service = buildSurveysService(repo, secret);
    await expect(service.respond(token, { calificacion: 4 }, undefined, now)).rejects.toMatchObject({ code: 'CSRF_INVALIDO' });
    expect(repo.answer).not.toHaveBeenCalled();
    expect(await service.respond(token, { calificacion: 4 }, csrfToken(secret, `survey:${token}`), now)).toEqual({ numero: row.numero, calificacion: 4 });
    expect(repo.auditResponse).toHaveBeenCalledWith(1, 7, 4, now);
    vi.mocked(repo.answer).mockResolvedValueOnce(undefined);
    await expect(service.respond(token, { calificacion: 5 }, csrfToken(secret, `survey:${token}`), now)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    expect(repo.auditResponse).toHaveBeenCalledTimes(1);
  });
});
