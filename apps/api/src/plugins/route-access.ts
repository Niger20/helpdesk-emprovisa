import fp from 'fastify-plugin';
import { permisoSchema } from '@helpdesk/contracts';
import type { Permiso } from '@helpdesk/contracts';
import type { AuthService } from '../modules/auth/index.js';
import { AppError } from '../common/errors/app-error.js';

interface AccessRoute {
  methods: string[];
  url: string;
  publica: boolean;
  permiso: Permiso | undefined;
}

declare module 'fastify' {
  interface FastifyContextConfig {
    publica?: boolean;
    permiso?: Permiso;
  }
  interface FastifyInstance {
    accessRoutes: AccessRoute[];
  }
}

const publicRoutes = new Set(['GET /health', 'OPTIONS *', 'GET /api/v1/auth/csrf', 'POST /api/v1/auth/login', 'GET /api/v1/encuestas/actual', 'POST /api/v1/encuestas/actual']);

export const routeAccessPlugin = fp<{ auth?: AuthService }>(async (app, options) => {
  app.decorate('accessRoutes', []);
  app.addHook('onRoute', (route) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    const publicAllowed = methods.every((method) => publicRoutes.has(`${method} ${route.url}`));
    if (route.url === '*' && methods.every((method) => method === 'OPTIONS')) route.config = { publica: true };
    if (route.config?.publica && !publicAllowed) {
      throw new Error(`Ruta pública fuera de la lista blanca: ${route.url}`);
    }
    if (!route.config?.publica && !route.config?.permiso) {
      throw new Error(`Ruta sin permiso explícito: ${route.url}`);
    }
    if (route.config?.permiso) permisoSchema.parse(route.config.permiso);
    app.accessRoutes.push({ methods, url: route.url, publica: route.config?.publica === true, permiso: route.config?.permiso });
  });
  app.addHook('preValidation', async (request) => {
    if (request.is404) return;
    if (!request.routeOptions.config.publica) {
      if (!options.auth) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
      const permiso = request.routeOptions.config.permiso;
      if (!permiso) throw new AppError('NO_AUTORIZADO', 403, 'Ruta sin permiso.');
      options.auth.assertPermission(request.sesion, permiso);
    }
  });
}, { name: 'route-access' });
