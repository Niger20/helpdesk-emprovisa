import { Link } from 'react-router';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useAssetDetail } from '../hooks/useAssetDetail';
import { AssetCard } from '../components/detail/AssetCard';
import { AssetCustodyHistory } from '../components/detail/AssetCustodyHistory';
import { AssetIncidents } from '../components/detail/AssetIncidents';
import { AppShell } from '../../../app/layouts/AppShell/AppShell';

export function AssetDetailPage() {
  const query = useAssetDetail();
  return <AppShell><div className="space-y-5">
    <Link to="/activos" className="inline-flex min-h-10 items-center font-semibold text-primary underline">Volver al inventario</Link>
    <QueryBoundary query={query} isEmpty={() => false}>{(asset) => <>
      <AssetCard asset={asset} /><AssetCustodyHistory history={asset.custodiaHistorial} /><AssetIncidents incidents={asset.incidentes} />
    </>}</QueryBoundary>
  </div></AppShell>;
}
