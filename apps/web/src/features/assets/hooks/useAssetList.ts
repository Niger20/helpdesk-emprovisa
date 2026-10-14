import { useState } from 'react';
import { assetQuerySchema } from '@helpdesk/contracts';
import type { AssetQuery } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { useAssets, useAssetCatalog } from './useAssets';

export function useAssetList() {
  const [filters, setFilters] = useState<AssetQuery>(assetQuerySchema.parse({}));
  const [showForm, setShowForm] = useState(false);
  const session = useAuth();
  const changeFilters = (next: Partial<AssetQuery>) => setFilters((previous) => ({ ...previous, ...next, page: next.page ?? 1 }));
  return { filters, changeFilters, showForm, setShowForm, query: useAssets(filters), catalog: useAssetCatalog(),
    canCreate: session.data?.usuario.permisos.includes('activo.crear') ?? false };
}
