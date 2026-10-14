import { readFileSync } from 'node:fs';
import { parseEnv as parseEnvFile } from 'node:util';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/config/env.js';
import { createDatabase } from '../src/infra/db/client.js';
import { createHealthRepository } from '../src/infra/db/health.repository.js';
import { migrate } from '../src/infra/db/migrate.js';
import { seedDemo } from '../src/infra/db/seeds/demo.seed.js';
import { demoPassword } from '../src/infra/db/seeds/context.js';
import { seedChecks } from './seed-checks.js';
import { auditChecks } from './audit-checks.js';
import { authChecks } from './auth-checks.js';
import { ticketOperationsChecks } from './ticket-operations-checks.js';
import { knowledgeChecks } from './knowledge-checks.js';
import { ticketLifecycleChecks } from './ticket-lifecycle-checks.js';
import { attachmentsChecks } from './attachments-checks.js';
import { surveysChecks } from './surveys-checks.js';
import { jobsChecks } from './jobs-checks.js';
import { notificationsMailChecks } from './notifications-mail-checks.js';
import { automaticAssignmentChecks } from './automatic-assignment-checks.js';
import { reportsChecks } from './reports-checks.js';
import { auditApiChecks } from './audit-api-checks.js';
import { adminIdentityChecks } from './admin-identity-checks.js';
import { catalogChecks } from './catalog-checks.js';
import { knowledgeFeedbackChecks } from './knowledge-feedback-checks.js';
import { parametersChecks } from './parameters-checks.js';
import { ticketsChecks } from './tickets-checks.js';
import { assetsChecks } from './assets-checks.js';

const localEnv = parseEnvFile(readFileSync(new URL('../../../.env', import.meta.url), 'utf8'));
const testInput: NodeJS.ProcessEnv = { ...localEnv, NODE_ENV: 'test' };
for (const key of ['DATABASE_URL', 'DATABASE_READONLY_URL', 'DATABASE_MIGRATOR_URL']) {
  const value = localEnv[key];
  if (!value) throw new Error(`Falta ${key} para las pruebas de integración.`);
  const url = new URL(value);
  url.pathname = '/helpdesk_test';
  testInput[key] = url.toString();
}
const env = parseEnv(testInput);
const migrator = new pg.Pool({ connectionString: env.DATABASE_MIGRATOR_URL, max: 1 });
const appPool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 1 });
const readonlyPool = new pg.Pool({ connectionString: env.DATABASE_READONLY_URL, max: 1 });
const databases = [createDatabase(env.DATABASE_URL, 1), createDatabase(env.DATABASE_READONLY_URL, 1)];
const seedDatabase = createDatabase(env.DATABASE_MIGRATOR_URL, 1);

describe('PostgreSQL real: bases y roles', () => {
  beforeAll(async () => {
    const result = await migrator.query<{ current_database: string }>('SELECT current_database()');
    if (result.rows[0]?.current_database !== 'helpdesk_test') throw new Error('La prueba solo puede recrear helpdesk_test.');
    await migrator.query('DROP SCHEMA IF EXISTS helpdesk_queue CASCADE');
    await migrator.query('DROP SCHEMA public CASCADE');
    await migrator.query('CREATE SCHEMA public AUTHORIZATION helpdesk_migrator');
    await migrator.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await migrator.query('GRANT USAGE ON SCHEMA public TO helpdesk_app, helpdesk_readonly');
    await migrator.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await migrate(env.DATABASE_MIGRATOR_URL);
    await seedDemo(seedDatabase, demoPassword, new Date('2026-10-12T21:00:00Z'));
    await migrator.query('CREATE TABLE public.foundation_probe (id integer PRIMARY KEY)');
    await migrator.query('INSERT INTO public.foundation_probe VALUES (1)');
    await migrator.query('GRANT SELECT ON public.foundation_probe TO helpdesk_app, helpdesk_readonly');
  });
  afterAll(async () => {
    await migrator.query('DROP TABLE IF EXISTS public.foundation_probe');
    await migrator.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await Promise.all([migrator.end(), appPool.end(), readonlyPool.end(), seedDatabase.destroy(), ...databases.map((db) => db.destroy())]);
  });
  it('el migrator es dueño y ningún rol es superusuario', async () => {
    const result = await migrator.query<{ rolname: string; rolsuper: boolean; rolcreatedb: boolean; rolcreaterole: boolean }>(
      "SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname IN ('helpdesk_migrator', 'helpdesk_app', 'helpdesk_readonly')",
    );
    expect(result.rows).toHaveLength(3);
    for (const role of result.rows) {
      expect(role.rolsuper || role.rolcreatedb || role.rolcreaterole).toBe(false);
    }
  });
  it('app puede consultar y no puede crear tablas', async () => {
    expect((await appPool.query('SELECT id FROM public.foundation_probe')).rows).toHaveLength(1);
    await expect(appPool.query('CREATE TABLE public.prohibida (id integer)')).rejects.toMatchObject({ code: '42501' });
  });
  it('readonly consulta pero rechaza escrituras', async () => {
    expect((await readonlyPool.query('SELECT id FROM public.foundation_probe')).rows).toHaveLength(1);
    await expect(readonlyPool.query('INSERT INTO public.foundation_probe VALUES (2)')).rejects.toMatchObject({ code: '25006' });
  });
  it('health consulta los dos pools de la base de pruebas', async () => {
    const app = await buildApp(env, createHealthRepository(databases));
    try { expect((await app.inject('/health')).statusCode).toBe(200); }
    finally { await app.close(); }
  });
  seedChecks(seedDatabase);
  auditChecks(appPool, readonlyPool);
  const appDatabase = databases[0];
  if (!appDatabase) throw new Error('Falta la base de aplicación para pruebas.');
  authChecks(appDatabase, env);
  assetsChecks(appDatabase, env);
  ticketsChecks(appDatabase, env);
  ticketOperationsChecks(appDatabase, env);
  knowledgeChecks(appDatabase, env);
  ticketLifecycleChecks(appDatabase, env);
  attachmentsChecks(appDatabase, env);
  surveysChecks(appDatabase, env);
  jobsChecks(appDatabase, env);
  notificationsMailChecks(appDatabase, env);
  automaticAssignmentChecks(appDatabase, env);
  reportsChecks(appDatabase, env);
  auditApiChecks(appDatabase, env);
  adminIdentityChecks(appDatabase, env);
  catalogChecks(appDatabase, env);
  knowledgeFeedbackChecks(appDatabase, env);
  parametersChecks(appDatabase, env);
});
