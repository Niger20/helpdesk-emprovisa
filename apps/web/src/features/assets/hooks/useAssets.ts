import { useQuery } from '@tanstack/react-query';
import type { AssetQuery } from '@helpdesk/contracts';
import { fetchAsset, fetchAssetCatalog, fetchAssets } from '../api/assets.api';
import { assetKeys } from '../api/assets.keys';

export const useAssets = (query: AssetQuery) => useQuery({ queryKey: assetKeys.list(query), queryFn: ({ signal }) => fetchAssets(query, signal) });
export const useAsset = (codigo: string) => useQuery({ queryKey: assetKeys.detail(codigo), queryFn: ({ signal }) => fetchAsset(codigo, signal), enabled: codigo.length > 0 });
export const useAssetCatalog = () => useQuery({ queryKey: assetKeys.catalog, queryFn: ({ signal }) => fetchAssetCatalog(signal) });
