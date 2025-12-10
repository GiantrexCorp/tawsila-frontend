"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  deleteRole,
  Role,
  RolesResponse,
} from "@/lib/services/roles";

/**
 * Hook to fetch all roles with caching
 * Roles are static data - cached for 30 minutes
 */
export function useRoles() {
  return useQuery<RolesResponse, Error>({
    queryKey: queryKeys.roles.list(),
    queryFn: fetchRoles,
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
  });
}

/**
 * Hook to fetch a single role by ID
 */
export function useRole(id: number) {
  return useQuery<Role, Error>({
    queryKey: [...queryKeys.roles.all, id],
    queryFn: () => fetchRole(id),
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
    enabled: !!id,
  });
}

/**
 * Hook to create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      // Invalidate roles list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

/**
 * Hook to update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateRole>[1] }) =>
      updateRole(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific role and list
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.roles.all, variables.id] });
    },
  });
}

/**
 * Hook to delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
