import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { TableSkeleton } from '../../../components/common/TableSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function RequireAuth() {
  const query = useAuth();
  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => { void query.refetch(); }} />;
  if (!query.data) return <Navigate to="/login" replace />;
  return <Outlet />;
}
