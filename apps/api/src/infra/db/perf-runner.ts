import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadLocalEnv } from '../../config/load-env.js';
import { parseEnv } from '../../config/env.js';
import { buildApp } from '../../app.js';
import { createDatabase } from './client.js';
import { createAuthService } from '../../modules/auth/index.js';
import type { SessionContext } from '../../modules/auth/index.js';
import { createUsersService } from '../../modules/users/index.js';
import { createRbacService } from '../../modules/rbac/index.js';
import { createGroupsService } from '../../modules/groups/index.js';
import { buildTicketsService } from '../../modules/tickets/index.js';
import { createAssetsService } from '../../modules/assets/index.js';
import { createKnowledgeService } from '../../modules/knowledge/index.js';
import { createReportsService } from '../../modules/reports/index.js';
import { createReportAuditRecorder } from '../../modules/audit/index.js';
import { demoPassword } from './seeds/context.js';

loadLocalEnv();
const outputDir = fileURLToPath(new URL('../../../../../.data/perf/', import.meta.url));
const original = parseEnv(process.env);
const testUrl = (value: string) => { const url = new URL(value); url.pathname = '/helpdesk_test'; return url.href; };
const env = parseEnv({ ...original, NODE_ENV: 'test', LOG_LEVEL: 'silent', PORT: 3001,
  DATABASE_URL: testUrl(original.DATABASE_URL), DATABASE_READONLY_URL: testUrl(original.DATABASE_READONLY_URL), DATABASE_MIGRATOR_URL: testUrl(original.DATABASE_MIGRATOR_URL),
  CORS_ORIGINS: 'http://127.0.0.1:3001', STORAGE_DIR: join(outputDir, 'storage') });
if ([env.DATABASE_URL, env.DATABASE_READONLY_URL, env.DATABASE_MIGRATOR_URL].some((value) => new URL(value).pathname !== '/helpdesk_test')) throw new Error('La carga solo usa helpdesk_test.');
const db = createDatabase(env.DATABASE_URL, 10); const readonly = createDatabase(env.DATABASE_READONLY_URL, 3);
const auth = await createAuthService(db, env.CSRF_SECRET); const users = createUsersService(db); const rbac = createRbacService(db); const groups = createGroupsService(db);
const tickets = buildTicketsService(db);
const admin = await auth.login({ username: 'admin.emergencia', password: demoPassword }, { direccionIp: '127.0.0.1', userAgent: 'Fixtures k6' }, new Date());
const sessions: { cookie: string; numero: string; perfil: number }[] = [];
const contexts: SessionContext[] = [admin.context];
await mkdir(outputDir, { recursive: true });
for (let index = 0; index < 63; index++) {
  const username = `perf.${String(index + 1).padStart(3, '0')}`; const perfil = index % 5;
  const existing = await users.list(admin.context, { page: 1, pageSize: 20, q: username });
  const user = existing.data.find((item) => item.username === username) ?? await users.create(admin.context, {
    username, password: demoPassword, nombreCompleto: `Carga ficticia ${index + 1}`, correo: `${username}@example.invalid`,
    cargo: null, extension: null, idSede: 1, idDepartamento: 1, idJefeInmediato: null });
  if (!(await rbac.list(admin.context, user.idUsuario)).length) await rbac.assign(admin.context, user.idUsuario, {
    idRol: perfil + 1, idSedeAlcance: perfil <= 1 ? 1 : null, vigenteDesde: '2026-10-01', vigenteHasta: null });
  if (perfil === 2 && !(await groups.members(admin.context, 2)).some((item) => item.idUsuario === user.idUsuario)) await groups.member(admin.context, 2, {
    idUsuario: user.idUsuario, esCoordinador: false, desde: '2026-10-01', hasta: null });
  const session = await auth.login({ username, password: demoPassword }, { direccionIp: `127.0.0.${index + 2}`, userAgent: 'Fixtures k6' }, new Date());
  contexts.push(session.context);
  const created = await tickets.create(admin.context, { titulo: `Caso de carga ${index + 1}`, descripcion: 'Datos ficticios de rendimiento local.', tipo: 'INCIDENTE',
    idCategoria: 4, impacto: 'BAJO', urgencia: 'BAJA', idActivo: null, idSolicitante: user.idUsuario, canalIngreso: 'TELEFONO' });
  sessions.push({ cookie: `helpdesk_sid=${session.token}`, numero: created.numero, perfil });
}
await writeFile(join(outputDir, 'sessions.json'), JSON.stringify(sessions), { mode: 0o600 });
const app = await buildApp(env, async () => true, auth, tickets, createAssetsService(db), createKnowledgeService(db), undefined,
  { reports: createReportsService(readonly, createReportAuditRecorder(db)) });
let closing = false;
const close = async () => {
  if (closing) return; closing = true; process.stdin.pause(); await app.close();
  await Promise.all(contexts.map((context) => auth.logout(context, new Date())));
  await unlink(join(outputDir, 'sessions.json')).catch(() => undefined);
  await readonly.destroy(); await db.destroy();
};
process.on('SIGINT', () => { void close(); }); process.on('SIGTERM', () => { void close(); });
process.stdin.on('data', (chunk: Buffer) => { if (chunk.toString().trim() === 'stop') void close(); });
await app.listen({ port: env.PORT, host: env.HOST });
process.stdout.write('API de carga local lista: 63 cuentas/sesiones, helpdesk_test, puerto 3001.\n');
