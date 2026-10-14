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
import { buildNotificationsService } from './modules/notifications/index.js';
import { buildJobsService } from './modules/jobs/index.js';
import { buildMailIngestService } from './modules/mail-ingest/index.js';
import { createSurveysService } from './modules/surveys/index.js';
import { createDemoSurveyDelivery } from './infra/mail/survey-delivery.js';
import { startQueue } from './infra/queue/boss.js';
import { createReportsService } from './modules/reports/index.js';
import { createAuditService, createReportAuditRecorder } from './modules/audit/index.js';
import { createUsersService } from './modules/users/index.js';
import { createRbacService } from './modules/rbac/index.js';
import { createGroupsService } from './modules/groups/index.js';

loadLocalEnv();
const env = parseEnv(process.env);
const databases = [createDatabase(env.DATABASE_URL, 10), createDatabase(env.DATABASE_READONLY_URL, 3)];
const checkHealth = createHealthRepository(databases);
const database = databases[0];
const readonlyDatabase = databases[1];
if (!database || !readonlyDatabase) throw new Error('No se configuraron las bases de aplicación y lectura.');
const auth = await createAuthService(database, env.CSRF_SECRET);
const delivery = createDemoSurveyDelivery();
const notifications = buildNotificationsService(database);
const jobs = buildJobsService(database, (trx, now) => buildNotificationsService(trx).dispatch(now), (trx, now) => buildMailIngestService(trx).ingest(now), delivery);
const app = await buildApp(env, checkHealth, auth, buildTicketsService(database, delivery), createAssetsService(database), createKnowledgeService(database), createAttachmentsService(database, env.STORAGE_DIR),
  { jobs, notifications, surveys: createSurveysService(database, env.CSRF_SECRET), mail: buildMailIngestService(database), invitations: delivery.list,
    reports: createReportsService(readonlyDatabase, createReportAuditRecorder(database)), audit: createAuditService(readonlyDatabase),
    users: createUsersService(database), rbac: createRbacService(database), groups: createGroupsService(database) });
let queue: Awaited<ReturnType<typeof startQueue>> | undefined;
app.addHook('onClose', async () => {
  try { await queue?.stop({ graceful: true, timeout: 5000 }); }
  finally { await Promise.all(databases.map((database) => database.destroy())); }
});

if (!await checkHealth()) {
  await app.close();
  throw new Error('No se pudo conectar a PostgreSQL con los roles de la aplicación.');
}
try { queue = await startQueue(env.DATABASE_URL, jobs, () => { app.log.error('La cola local notificó un error; revisá el estado de las tareas.'); }); }
catch (error) { await app.close(); throw error; }

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void app.close(); });
}
try { await app.listen({ host: env.HOST, port: env.PORT }); }
catch (error) { await app.close(); throw error; }
