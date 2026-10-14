import { fileURLToPath } from 'node:url';
import { runner } from 'node-pg-migrate';
import { parseEnv } from '../../config/env.js';
import { loadLocalEnv } from '../../config/load-env.js';

export async function migrate(databaseUrl: string) {
  await runner({
    databaseUrl, direction: 'up', count: Infinity,
    dir: fileURLToPath(new URL('./migrations', import.meta.url)),
    migrationsTable: 'pgmigrations', log: () => {},
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadLocalEnv();
  const env = parseEnv(process.env);
  await migrate(env.DATABASE_MIGRATOR_URL);
  process.stdout.write('Migraciones aplicadas.\n');
}
