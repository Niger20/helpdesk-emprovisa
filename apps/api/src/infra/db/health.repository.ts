import { sql } from 'kysely';
import type { Database } from './client.js';

export function createHealthRepository(databases: readonly Database[]) {
  return async (): Promise<boolean> => {
    try {
      await Promise.all(databases.map((database) => sql`select 1`.execute(database)));
      return true;
    } catch {
      return false;
    }
  };
}
