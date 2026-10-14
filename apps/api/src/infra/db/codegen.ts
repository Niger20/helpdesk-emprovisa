import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generate, PostgresDialect } from 'kysely-codegen';
import { parseEnv } from '../../config/env.js';
import { loadLocalEnv } from '../../config/load-env.js';
import { createDatabase } from './client.js';

loadLocalEnv();
const env = parseEnv(process.env);
const database = createDatabase(env.DATABASE_MIGRATOR_URL, 1);
try {
  const source = await generate({
    db: database, dialect: new PostgresDialect({ dateParser: 'string' }),
    defaultSchemas: ['public'], includePattern: 'public.*', excludePattern: 'pgmigrations', camelCase: true, outFile: null,
  });
  const directory = fileURLToPath(new URL('./generated', import.meta.url));
  await mkdir(directory, { recursive: true });
  const helpers = source.slice(0, source.indexOf('export interface'));
  await writeFile(`${directory}/helpers.ts`, helpers);
  const definitions = [...source.matchAll(/export interface (\w+) \{[^}]*\}/g)];
  const imports: string[] = [];
  for (const match of definitions) {
    const name = match[1];
    if (!name || name === 'DB') continue;
    const block = match[0];
    const used = ['Generated', 'Int8', 'Json', 'Timestamp'].filter((type) => new RegExp(`\\b${type}\\b`).test(block));
    const header = used.length ? `import type { ${used.join(', ')} } from './helpers.js';\n\n` : '';
    const file = name.replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`);
    await writeFile(`${directory}/${file}.ts`, `${header}${block}\n`);
    imports.push(`import type { ${name} } from './generated/${file}.js';`);
  }
  const db = definitions.find((match) => match[1] === 'DB');
  if (!db) throw new Error('No se generó el contrato de la base.');
  await writeFile(fileURLToPath(new URL('./generated-types.ts', import.meta.url)), `${imports.join('\n')}\n\n${db[0]}\n`);
} finally { await database.destroy(); }
