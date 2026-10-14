import { expect, it } from 'vitest';
import { permisoSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { createAssetsService } from '../src/modules/assets/index.js';
import { createKnowledgeService } from '../src/modules/knowledge/index.js';
import { createAttachmentsService } from '../src/modules/tickets/attachments/index.js';
import { buildNotificationsService } from '../src/modules/notifications/index.js';
import { buildJobsService } from '../src/modules/jobs/index.js';
import { buildMailIngestService } from '../src/modules/mail-ingest/index.js';
import { createSurveysService } from '../src/modules/surveys/index.js';
import { createDemoSurveyDelivery } from '../src/infra/mail/survey-delivery.js';
import { createReportsService } from '../src/modules/reports/index.js';
import { createAuditService, createReportAuditRecorder } from '../src/modules/audit/index.js';
import { createUsersService } from '../src/modules/users/index.js';
import { createRbacService } from '../src/modules/rbac/index.js';
import { createGroupsService } from '../src/modules/groups/index.js';
import { createCatalogService } from '../src/modules/catalog/index.js';
import { createCalendarsService } from '../src/modules/settings/calendars/index.js';
import { createParametersService } from '../src/modules/settings/parameters/index.js';
import { createRoleCatalogService } from '../src/modules/rbac/role-catalog/index.js';
import { createSlaSettingsService } from '../src/modules/settings/sla/index.js';

export function runtimeRouteAccessChecks(database: Database, readonlyDatabase: Database, env: Env) {
  it('cada ruta de todos los módulos del runtime declara permiso o lista blanca y deniega acceso anónimo', async () => {
    const auth = await createAuthService(database, env.CSRF_SECRET);
    const delivery = createDemoSurveyDelivery();
    const notifications = buildNotificationsService(database);
    const mail = buildMailIngestService(database);
    const jobs = buildJobsService(database, (trx, now) => buildNotificationsService(trx).dispatch(now),
      (trx, now) => buildMailIngestService(trx).ingest(now), delivery);
    const app = await buildApp(env, async () => true, auth, buildTicketsService(database, delivery),
      createAssetsService(database), createKnowledgeService(database), createAttachmentsService(database, env.STORAGE_DIR),
      { notifications, mail, jobs, invitations: delivery.list, surveys: createSurveysService(database, env.CSRF_SECRET),
        reports: createReportsService(readonlyDatabase, createReportAuditRecorder(database)), audit: createAuditService(readonlyDatabase),
        users: createUsersService(database), rbac: createRbacService(database), groups: createGroupsService(database),
        catalog: createCatalogService(database), calendars: createCalendarsService(database), parameters: createParametersService(database),
        roleCatalog: createRoleCatalogService(database), slaSettings: createSlaSettingsService(database) });
    const allowedPublic = new Set(['GET /health', 'OPTIONS *', 'GET /api/v1/auth/csrf', 'POST /api/v1/auth/login',
      'GET /api/v1/encuestas/actual', 'POST /api/v1/encuestas/actual']);
    try {
      await app.ready();
      const routes = app.accessRoutes.flatMap((route) => route.methods.map((method) => ({ ...route, method })));
      expect(routes.length).toBeGreaterThan(60);
      expect(new Set(routes.map((route) => `${route.method} ${route.url}`)).size).toBe(routes.length);
      for (const route of routes) {
        if (route.publica) expect(allowedPublic.has(`${route.method} ${route.url}`)).toBe(true);
        else {
          expect(permisoSchema.safeParse(route.permiso).success, `${route.method} ${route.url}`).toBe(true);
          const response = await app.inject({ method: route.method as 'GET' | 'POST' | 'PUT' | 'DELETE', url: route.url });
          expect(response.statusCode, `${route.method} ${route.url}`).toBe(401);
        }
      }
      expect(new Set(routes.filter((route) => route.publica).map((route) => `${route.method} ${route.url}`))).toEqual(allowedPublic);
    } finally { await app.close(); }
  });
}
