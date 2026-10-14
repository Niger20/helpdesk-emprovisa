import { parseEnv } from '../src/config/env.js';

export const rawTestEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://helpdesk_app:prueba@127.0.0.1:5432/helpdesk_test',
  DATABASE_READONLY_URL: 'postgresql://helpdesk_readonly:prueba@127.0.0.1:5432/helpdesk_test',
  DATABASE_MIGRATOR_URL: 'postgresql://helpdesk_migrator:prueba@127.0.0.1:5432/helpdesk_test',
  STORAGE_DIR: '.data/test-uploads',
  CSRF_SECRET: '1'.repeat(64),
};
export const testEnv = parseEnv(rawTestEnv);
