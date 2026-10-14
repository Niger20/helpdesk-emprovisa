import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { Env } from './config/env.js';
import { registerHealthRoute } from './common/http/health.routes.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { routeAccessPlugin } from './plugins/route-access.js';
import { registerCors } from './plugins/cors.js';
import { sessionAuthPlugin } from './plugins/session-auth.js';
import { csrfPlugin } from './plugins/csrf.js';
import { loginAttemptsPlugin } from './plugins/login-attempts.js';
import { registerAuthRoutes } from './modules/auth/index.js';
import type { AuthService } from './modules/auth/index.js';
import { registerTicketsRoutes } from './modules/tickets/index.js';
import type { TicketsService } from './modules/tickets/index.js';
import { registerAssetsRoutes } from './modules/assets/index.js';
import type { AssetsService } from './modules/assets/index.js';
import { registerKnowledgeRoutes } from './modules/knowledge/index.js';
import type { KnowledgeService } from './modules/knowledge/index.js';
import multipart from '@fastify/multipart';
import { registerAttachmentsRoutes } from './modules/tickets/attachments/index.js';
import type { AttachmentsService } from './modules/tickets/attachments/index.js';
import { registerJobsRoutes } from './modules/jobs/index.js';
import type { JobsService } from './modules/jobs/index.js';
import { registerNotificationsRoutes } from './modules/notifications/index.js';
import type { NotificationsService } from './modules/notifications/index.js';
import { registerSurveysRoutes } from './modules/surveys/index.js';
import type { SurveysService } from './modules/surveys/index.js';
import { registerMailIngestRoutes } from './modules/mail-ingest/index.js';
import type { MailIngestService } from './modules/mail-ingest/index.js';
import { registerReportsRoutes } from './modules/reports/index.js';
import type { ReportsService } from './modules/reports/index.js';
import { registerAuditRoutes } from './modules/audit/index.js';
import type { AuditService } from './modules/audit/index.js';
import { registerUsersRoutes } from './modules/users/index.js';
import type { UsersService } from './modules/users/index.js';
import { registerRbacRoutes } from './modules/rbac/index.js';
import type { RbacService } from './modules/rbac/index.js';
import { registerGroupsRoutes } from './modules/groups/index.js';
import type { GroupsService } from './modules/groups/index.js';

interface AutomationServices { jobs?: JobsService; notifications?: NotificationsService; surveys?: SurveysService; mail?: MailIngestService;
  invitations?: (idUsuario: number) => { numero: string; enlace: string; expiraEn: string }[]; reports?: ReportsService; audit?: AuditService;
  users?: UsersService; rbac?: RbacService; groups?: GroupsService }

export async function buildApp(env: Env, checkHealth: () => Promise<boolean>, auth?: AuthService, tickets?: TicketsService, assets?: AssetsService, knowledge?: KnowledgeService, attachments?: AttachmentsService, automations: AutomationServices = {}) {
  const app = Fastify({
    exposeHeadRoutes: false,
    requestTimeout: 10_000,
    bodyLimit: 16_384,
    logger: env.NODE_ENV === 'test' ? false : {
      level: env.LOG_LEVEL,
      redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers.x-csrf-token',
        'req.headers.x-survey-token', 'password', 'token', 'correo'],
      serializers: { req: (request: { method: string; id: string }) => ({ method: request.method, id: request.id }) },
    },
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(errorHandlerPlugin);
  await app.register(cookie);
  await app.register(routeAccessPlugin, auth ? { auth } : {});
  await registerCors(app, env);
  await app.register(helmet, { contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } } });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(sessionAuthPlugin, auth ? { auth } : {});
  await app.register(csrfPlugin, { secret: env.CSRF_SECRET });
  if (auth) {
    await app.register(loginAttemptsPlugin, { auth });
    registerAuthRoutes(app, auth, env.CSRF_SECRET);
  }
  registerHealthRoute(app, checkHealth);
  if (tickets) registerTicketsRoutes(app, tickets);
  if (assets) registerAssetsRoutes(app, assets);
  if (knowledge) registerKnowledgeRoutes(app, knowledge);
  if (attachments) { await app.register(multipart); registerAttachmentsRoutes(app, attachments); }
  if (automations.jobs) registerJobsRoutes(app, automations.jobs);
  if (automations.notifications) registerNotificationsRoutes(app, automations.notifications, automations.invitations);
  if (automations.surveys) registerSurveysRoutes(app, automations.surveys);
  if (automations.mail) registerMailIngestRoutes(app, automations.mail);
  if (automations.reports) registerReportsRoutes(app, automations.reports);
  if (automations.audit) registerAuditRoutes(app, automations.audit);
  if (automations.users) registerUsersRoutes(app, automations.users);
  if (automations.rbac) registerRbacRoutes(app, automations.rbac);
  if (automations.groups) registerGroupsRoutes(app, automations.groups);
  return app;
}
