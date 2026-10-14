import { assetCatalogSchema, assetDetailSchema, assetListSchema } from '@helpdesk/contracts';
import type { AssetCreate, AssetQuery } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export function fetchAssets(query: AssetQuery, signal: AbortSignal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
  return http(`/api/v1/activos?${params}`, assetListSchema, { signal });
}
export const fetchAsset = (codigo: string, signal: AbortSignal) => http(`/api/v1/activos/${encodeURIComponent(codigo)}`, assetDetailSchema, { signal });
export const fetchAssetCatalog = (signal: AbortSignal) => http('/api/v1/activos/catalogos', assetCatalogSchema, { signal });
export const createAsset = (data: AssetCreate, csrfToken: string) => http('/api/v1/activos', assetDetailSchema, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(data),
});
