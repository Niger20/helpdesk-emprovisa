import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './TableSkeleton';

interface Props<T> {
  query: UseQueryResult<T, Error>;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
  emptyState?: ReactNode;
}

export function QueryBoundary<T>({ query, isEmpty, children, emptyState }: Props<T>) {
  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => { void query.refetch(); }} />;
  if (isEmpty(query.data)) return emptyState ?? <EmptyState />;
  return children(query.data);
}
