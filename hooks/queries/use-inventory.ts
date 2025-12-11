"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import {
  fetchInventories,
  fetchInventory,
  fetchCurrentInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  Inventory,
  CreateInventoryRequest,
  UpdateInventoryRequest,
} from "@/lib/services/inventories";

/**
 * Hook to fetch all inventories
 * Inventories are semi-static - cached for 5 minutes
 */
export function useInventories(filters: Record<string, unknown> = {}) {
  return useQuery<Inventory[], Error>({
    queryKey: queryKeys.inventory.list(filters),
    queryFn: fetchInventories,
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook to fetch a single inventory by ID
 */
export function useInventory(id: number) {
  return useQuery<Inventory, Error>({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: () => fetchInventory(id),
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to fetch current user's inventory
 */
export function useCurrentInventory() {
  return useQuery<Inventory, Error>({
    queryKey: [...queryKeys.inventory.all, "current"],
    queryFn: fetchCurrentInventory,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    retry: 1, // Only retry once
  });
}

/**
 * Hook to create a new inventory
 */
export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryData: CreateInventoryRequest) => createInventory(inventoryData),
    onSuccess: () => {
      // Invalidate inventory lists
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
    },
  });
}

/**
 * Hook to update an inventory
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInventoryRequest }) =>
      updateInventory(id, data),
    onSuccess: (updatedInventory, variables) => {
      // Update the specific inventory in cache
      queryClient.setQueryData(queryKeys.inventory.detail(variables.id), updatedInventory);
      // Invalidate inventory lists
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      // Invalidate current inventory if it's the same
      queryClient.invalidateQueries({ queryKey: [...queryKeys.inventory.all, "current"] });
    },
  });
}

/**
 * Hook to delete an inventory
 */
export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInventory,
    onSuccess: (_, deletedId) => {
      // Remove inventory from cache
      queryClient.removeQueries({ queryKey: queryKeys.inventory.detail(deletedId) });
      // Invalidate inventory lists
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
    },
  });
}

/**
 * Hook to prefetch an inventory (for hover/preload scenarios)
 */
export function usePrefetchInventory() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.inventory.detail(id),
      queryFn: () => fetchInventory(id),
      staleTime: STALE_TIMES.SEMI_STATIC,
    });
  };
}

/**
 * Hook to invalidate inventory caches
 */
export function useInvalidateInventory() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() }),
    invalidateInventory: (id: number) => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) }),
  };
}
