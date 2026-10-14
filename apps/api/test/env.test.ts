import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.js';
import { rawTestEnv as testEnv } from './fixtures.js';

describe('Configuración segura', () => {
  it('falla si faltan conexiones sin imprimir credenciales', () => {
    expect(() => parseEnv({})).toThrow('Configuración inválida');
  });
  it('rechaza escuchar en la red', () => {
    expect(() => parseEnv({ ...testEnv, HOST: '0.0.0.0' })).toThrow('HOST');
  });
  it('rechaza el superusuario como cuenta de aplicación', () => {
    expect(() => parseEnv({ ...testEnv, DATABASE_URL: 'postgresql://postgres:secreto@localhost/helpdesk' }))
      .toThrow('DATABASE_URL');
  });
  it('rechaza conectar los roles a bases distintas', () => {
    expect(() => parseEnv({ ...testEnv, DATABASE_READONLY_URL: testEnv.DATABASE_READONLY_URL.replace('helpdesk_test', 'helpdesk') }))
      .toThrow('conexiones');
  });
  it('reserva la base de pruebas para NODE_ENV=test', () => {
    expect(() => parseEnv({ ...testEnv, NODE_ENV: 'production' })).toThrow('conexiones');
  });
});
