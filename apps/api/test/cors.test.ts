import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { testEnv } from './fixtures.js';
import { parseEnv } from '../src/config/env.js';
import { rawTestEnv } from './fixtures.js';

describe('CORS configurable', () => {
  it.each(['http://localhost:5173', 'http://localhost:3000'])('permite el origen local %s con credenciales', async (origin) => {
    const app = await buildApp(testEnv, async () => true);
    try {
      const response = await app.inject({ url: '/health', headers: { origin } });
      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    } finally { await app.close(); }
  });
  it('niega orígenes ajenos sin publicar una cabecera de autorización', async () => {
    const app = await buildApp(testEnv, async () => true);
    try {
      const response = await app.inject({ url: '/health', headers: { origin: 'https://otro.example' } });
      expect(response.statusCode).toBe(403);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    } finally { await app.close(); }
  });
  it('responde la preflight con el header CSRF permitido', async () => {
    const app = await buildApp(testEnv, async () => true);
    try {
      const response = await app.inject({ method: 'OPTIONS', url: '/api/v1/tickets', headers: {
        origin: 'http://localhost:5173', 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-csrf-token',
      } });
      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-headers']).toContain('X-CSRF-Token');
    } finally { await app.close(); }
  });
  it('acepta una lista personalizada y rechaza comodines', () => {
    expect(parseEnv({ ...rawTestEnv, PORT: '3001', CORS_ORIGINS: 'http://localhost:3001' }).CORS_ORIGINS)
      .toEqual(['http://localhost:3001']);
    expect(() => parseEnv({ ...rawTestEnv, CORS_ORIGINS: '*' })).toThrow('CORS_ORIGINS');
  });
});
