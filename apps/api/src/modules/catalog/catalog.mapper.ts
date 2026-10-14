import { categorySchema } from '@helpdesk/contracts';
import type { CatalogRepository } from './catalog.repository.js';

export const mapCategory = (row: NonNullable<Awaited<ReturnType<CatalogRepository['find']>>>) => categorySchema.parse(row);
