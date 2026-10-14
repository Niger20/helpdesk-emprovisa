import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { DB } from './generated-types.js';

// DATE es una fecha civil; conservar yyyy-mm-dd evita conversiones horarias.
pg.types.setTypeParser(pg.types.builtins.DATE, (value: string) => value);

export function createDatabase(connectionString: string, max: number) {
  return new Kysely<DB>({
    plugins: [new CamelCasePlugin()],
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max, connectionTimeoutMillis: 1500, query_timeout: 1500 }),
    }),
  });
}

export type Database = ReturnType<typeof createDatabase>;
