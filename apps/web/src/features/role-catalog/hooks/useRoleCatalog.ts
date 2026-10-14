import { useQuery } from '@tanstack/react-query';
import { fetchRoleCatalog, roleCatalogKeys } from '../api/role-catalog.api';

export function useRoleCatalog() { return useQuery({ queryKey: roleCatalogKeys.all, queryFn: fetchRoleCatalog }); }
