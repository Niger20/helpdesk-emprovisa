import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function loadLocalEnv() {
  const path = fileURLToPath(new URL('../../../../.env', import.meta.url));
  if (process.env.NODE_ENV !== 'production' && existsSync(path)) process.loadEnvFile(path);
}
