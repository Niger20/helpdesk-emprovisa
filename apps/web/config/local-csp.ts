import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Connect, Plugin } from 'vite';

export const noncePlaceholder = '__HELPDESK_DOCUMENT_NONCE__';

export function documentPolicy(nonce: string, host?: string) {
  const connections = ["'self'"];
  if (host) {
    const url = new URL(`http://${host}`);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password || url.pathname !== '/') {
      throw new Error('El documento solo puede servirse por loopback.');
    }
    connections.push(`ws://${url.host}`);
  }
  return ["default-src 'none'", `script-src 'self' 'nonce-${nonce}'`, "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`, "style-src-attr 'unsafe-inline'", "img-src 'self' data: blob:",
    "font-src 'self'", `connect-src ${connections.join(' ')}`, "object-src 'none'", "base-uri 'none'",
    "frame-ancestors 'none'", "form-action 'self'"].join('; ');
}

export function secureDocument(html: string, host?: string) {
  const nonce = randomBytes(32).toString('base64');
  return { html: html.replaceAll(noncePlaceholder, nonce), policy: documentPolicy(nonce, host) };
}

type Transform = (url: string, html: string) => Promise<string>;
function documentMiddleware(path: string, transform?: Transform): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? '/';
    const pathname = url.split('?')[0] ?? '/';
    if (request.method !== 'GET' || pathname.startsWith('/api/') || pathname === '/health'
      || (!request.headers.accept?.includes('text/html') && pathname !== '/' && pathname !== '/index.html')
      || /\.[^/]+$/.test(pathname) && pathname !== '/index.html') return next();
    void (async () => {
      const source = await readFile(path, 'utf8');
      const transformed = transform ? await transform(url, source) : source;
      const document = secureDocument(transformed, transform ? request.headers.host : undefined);
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Content-Security-Policy', document.policy);
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('Cache-Control', 'no-store');
      response.end(document.html);
    })().catch(next);
  };
}

export function localCsp(): Plugin {
  return {
    name: 'helpdesk-local-csp',
    configureServer(server) {
      server.middlewares.use(documentMiddleware(resolve(server.config.root, 'index.html'),
        (url, html) => server.transformIndexHtml(url, html)));
    },
    configurePreviewServer(server) {
      server.middlewares.use(documentMiddleware(resolve(server.config.root, server.config.build.outDir, 'index.html')));
    },
  };
}
