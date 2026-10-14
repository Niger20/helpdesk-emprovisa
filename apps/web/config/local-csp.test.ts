import { describe, expect, it } from 'vitest';
import { documentPolicy, secureDocument, noncePlaceholder } from './local-csp';

describe('CSP de documentos locales', () => {
  it('genera un nonce independiente por respuesta y coincide con script y meta', () => {
    const source = `<meta property="csp-nonce" nonce="${noncePlaceholder}"><script nonce="${noncePlaceholder}"></script>`;
    const first = secureDocument(source, '127.0.0.1:5173');
    const second = secureDocument(source, '127.0.0.1:5173');
    expect(first.policy).not.toBe(second.policy);
    const nonce = /'nonce-([^']+)'/.exec(first.policy)?.[1];
    expect(nonce).toBeDefined();
    expect(Buffer.from(nonce ?? '', 'base64')).toHaveLength(32);
    expect(first.html).toBe(source.replaceAll(noncePlaceholder, nonce ?? ''));
    expect(first.html).not.toContain(noncePlaceholder);
  });

  it('permite HMR solo por el host loopback y excluye scripts/evaluación inline', () => {
    const policy = documentPolicy('nonce-de-prueba', 'localhost:5174');
    expect(policy).toContain("connect-src 'self' ws://localhost:5174");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline|unsafe-eval|https:/);
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
  });

  it.each(['example.invalid:5173', 'localhost:5173/externo', 'otro@localhost:5173'])('rechaza host %s', (host) => {
    expect(() => documentPolicy('nonce-de-prueba', host)).toThrow();
  });

  it('la vista compilada no necesita websocket ni orígenes externos', () => {
    const policy = secureDocument('<html></html>').policy;
    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain('ws:');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("default-src 'none'");
  });
});
