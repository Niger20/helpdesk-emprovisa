import { buildApp } from './app.js';
import { parseEnv } from './config/env.js';
import { loadLocalEnv } from './config/load-env.js';
import { createDatabase } from './infra/db/client.js';
import { createHealthRepository } from './infra/db/health.repository.js';
import { createAuthService } from './modules/auth/index.js';
import { buildTicketsService } from './modules/tickets/index.js';
import { createAssetsService } from './modules/assets/index.js';
import { createKnowledgeService } from './modules/knowledge/index.js';
import { createAttachmentsService } from './modules/tickets/attachments/index.js';

loadLocalEnv();
const env = parseEnv(process.env);
const databases = [createDatabase(env.DATABASE_URL, 10), createDatabase(env.DATABASE_READONLY_URL, 3)];
const checkHealth = createHealthRepository(databases);
const database = databases[0];
if (!database) throw new Error('No se configuró la base de aplicación.');
const auth = await createAuthService(database, env.CSRF_SECRET);
const app = await buildApp(env, checkHealth, auth, buildTicketsService(database), createAssetsService(database), createKnowledgeService(database), createAttachmentsService(database, env.STORAGE_DIR));
app.addHook('onClose', async () => { await Promise.all(databases.map((database) => database.destroy())); });

if (!await checkHealth()) {
  await app.close();
  throw new Error('No se pudo conectar a PostgreSQL con los roles de la aplicación.');
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void app.close(); });
}
await app.listen({ host: env.HOST, port: env.PORT });
