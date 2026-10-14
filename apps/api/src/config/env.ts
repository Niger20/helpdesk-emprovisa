import { z } from 'zod';

function databaseUrl(role: string) {
  return z.url().refine((value) => {
    let url: URL;
    try { url = new URL(value); } catch { return false; }
    return ['postgres:', 'postgresql:'].includes(url.protocol)
      && decodeURIComponent(url.username) === role
      && url.password.length > 0
      && ['/helpdesk', '/helpdesk_test'].includes(url.pathname);
  }, 'La conexión debe usar el rol asignado y una base del proyecto.');
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.literal('127.0.0.1').default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  CORS_ORIGINS: z.string().default('http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.url().refine((value) => {
      let origin: URL;
      try { origin = new URL(value); } catch { return false; }
      return ['http:', 'https:'].includes(origin.protocol) && origin.origin === value;
    }, 'Usá orígenes exactos, sin comodines ni rutas.')).min(1)),
  DATABASE_URL: databaseUrl('helpdesk_app'),
  DATABASE_READONLY_URL: databaseUrl('helpdesk_readonly'),
  DATABASE_MIGRATOR_URL: databaseUrl('helpdesk_migrator'),
  STORAGE_DIR: z.string().min(1),
  CSRF_SECRET: z.string().regex(/^[a-f0-9]{64}$/),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
}).superRefine((value, context) => {
  const connections = [value.DATABASE_URL, value.DATABASE_READONLY_URL, value.DATABASE_MIGRATOR_URL]
    .map((connection) => new URL(connection));
  const target = connections[0];
  if (connections.some((url) => url.host !== target?.host || url.pathname !== target?.pathname)) {
    context.addIssue({ code: 'custom', message: 'Los tres roles deben apuntar a la misma base.' });
  }
  if (value.NODE_ENV !== 'test' && target?.pathname === '/helpdesk_test') {
    context.addIssue({ code: 'custom', message: 'helpdesk_test se reserva para pruebas.' });
  }
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, unknown>): Env {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.') || 'conexiones');
    throw new Error(`Configuración inválida: ${[...new Set(fields)].join(', ')}.`);
  }
  return result.data;
}
