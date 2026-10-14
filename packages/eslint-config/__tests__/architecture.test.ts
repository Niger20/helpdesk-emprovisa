import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

describe('Límites de arquitectura', () => {
  it('prohíbe importar un componente interno de otro feature', async () => {
    const result = await eslint.lintText('export { AvailabilityPage } from "../features/admin/pages/AvailabilityPage";', {
      filePath: resolve('apps/web/src/app/App.tsx'),
    });
    expect(result[0]?.messages.map((message) => message.ruleId)).toContain('boundaries/dependencies');
  });
  it('permite acceder por el index público', async () => {
    const result = await eslint.lintText('export { AvailabilityPage } from "../features/admin";', {
      filePath: resolve('apps/web/src/app/App.tsx'),
    });
    expect(result[0]?.errorCount).toBe(0);
  });
  it('rechaza dos componentes exportados en el mismo archivo', async () => {
    const result = await eslint.lintText('export function Uno() { return null; }\nexport function Dos() { return null; }', {
      filePath: resolve('apps/web/src/app/App.tsx'),
    });
    expect(result[0]?.messages.map((message) => message.ruleId)).toContain('helpdesk/one-component');
  });
  it('impide usar Kysely desde una ruta', async () => {
    const result = await eslint.lintText('export { sql } from "kysely";', {
      filePath: resolve('apps/api/src/common/http/health.routes.ts'),
    });
    expect(result[0]?.messages.map((message) => message.ruleId)).toContain('no-restricted-imports');
  });
});
