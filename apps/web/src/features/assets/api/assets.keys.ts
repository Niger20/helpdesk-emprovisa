import type { AssetQuery } from '@helpdesk/contracts';

export const assetKeys = {
  all: ['activos'] as const,
  list: (query: AssetQuery) => ['activos', 'lista', query] as const,
  detail: (codigo: string) => ['activos', 'ficha', codigo] as const,
  catalog: ['activos', 'catalogos'] as const,
};
