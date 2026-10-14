import type { Transaction } from 'kysely';
import type { DB } from '../generated-types.js';

export type SeedTransaction = Transaction<DB>;
export const demoUsername = 'admin.emergencia';
export const demoPassword = 'EmprovisaDemo!2026';
