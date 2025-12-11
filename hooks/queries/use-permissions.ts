"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import {
  fetchPermissions,
  PermissionsResponse,
  PermissionFilters,
} from "@/lib/services/permissions";

/**
 * Hook to fetch all permissions with caching
 * Permissions are static data - cached for 30 minutes
 */
export function usePermissions(page: number = 1, filters?: PermissionFilters) {
  return useQuery<PermissionsResponse, Error>({
    queryKey: [...queryKeys.roles.all, 'permissions', page, filters],
    queryFn: () => fetchPermissions(page, filters),
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
  });
}
