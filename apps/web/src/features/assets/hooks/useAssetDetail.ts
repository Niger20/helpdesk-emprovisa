import { useParams } from 'react-router';
import { useAsset } from './useAssets';

export function useAssetDetail() {
  const { codigoPatrimonial = '' } = useParams<{ codigoPatrimonial: string }>();
  return useAsset(codigoPatrimonial);
}
