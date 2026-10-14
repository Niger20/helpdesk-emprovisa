import { parseEnv } from '../../../config/env.js';
import { loadLocalEnv } from '../../../config/load-env.js';
import { createDatabase } from '../client.js';
import { seedDemo } from './demo.seed.js';
import { demoPassword, demoUsername } from './context.js';

loadLocalEnv();
const env = parseEnv(process.env);
const target = new URL(env.DATABASE_MIGRATOR_URL);
if (env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
  throw new Error('La seed de demostración solo se ejecuta en desarrollo/pruebas locales.');
}
const database = createDatabase(env.DATABASE_MIGRATOR_URL, 1);
try {
  const result = await seedDemo(database, demoPassword);
  process.stdout.write(`Seed ${result}. Usuario de prueba: ${demoUsername}. Ver README.md.\n`);
} finally { await database.destroy(); }
