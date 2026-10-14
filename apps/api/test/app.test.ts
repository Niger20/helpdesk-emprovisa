import { healthResponseSchema, problemSchema } from '@helpdesk/contracts';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { testEnv } from './fixtures.js';

describe('Disponibilidad y acceso de rutas', () => {
  it.each([true, false])('health refleja conexión=%s y aplica cabeceras seguras', async (available) => {
    const app = await buildApp(testEnv, async () => available);
    try {
      const response = await app.inject('/health');
      expect(response.statusCode).toBe(available ? 200 : 503);
      expect(healthResponseSchema.parse(response.json()).estado).toBe(available ? 'DISPONIBLE' : 'NO_DISPONIBLE');
      expect(response.headers['content-security-policy']).toContain("default-src 'none'");
      expect(response.headers['strict-transport-security']).toBeDefined();
    } finally { await app.close(); }
  });
  it('rechaza una ruta sin permiso explícito al registrarla', async () => {
    const app = await buildApp(testEnv, async () => true);
    try { expect(() => app.get('/api/v1/privado', async () => ({}))).toThrow('sin permiso explícito'); }
    finally { await app.close(); }
  });
  it('impide convertir otra ruta en pública por configuración', async () => {
    const app = await buildApp(testEnv, async () => true);
    try {
      expect(() => app.get('/api/v1/privado', { config: { publica: true } }, async () => ({})))
        .toThrow('fuera de la lista blanca');
    } finally { await app.close(); }
  });
  it('deniega acceso a una ruta declarada hasta implementar sesión', async () => {
    const app = await buildApp(testEnv, async () => true);
    app.get('/api/v1/privado', { config: { permiso: 'ticket.crear' } }, async () => ({}));
    try {
      const response = await app.inject('/api/v1/privado');
      expect(response.statusCode).toBe(401);
      expect(problemSchema.parse(response.json()).code).toBe('NO_AUTENTICADO');
    } finally { await app.close(); }
  });
  it('responde problem+json para rutas inexistentes', async () => {
    const app = await buildApp(testEnv, async () => true);
    try {
      const response = await app.inject('/no-existe');
      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(problemSchema.parse(response.json()).code).toBe('RUTA_NO_ENCONTRADA');
    } finally { await app.close(); }
  });
  it('recorre todas las rutas y verifica permiso o lista blanca', async () => {
    const app = await buildApp(testEnv, async () => true);
    app.get('/api/v1/privado', { config: { permiso: 'ticket.crear' } }, async () => ({}));
    try {
      await app.ready();
      expect(app.printRoutes()).toContain('health');
      expect(app.accessRoutes).toHaveLength(3);
      for (const route of app.accessRoutes) {
        expect(route.permiso || (route.publica && ['/health', '*'].includes(route.url))).toBeTruthy();
      }
    } finally { await app.close(); }
  });
});
