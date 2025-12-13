"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventoryUsers,
  syncInventoryUsers,
  fetchUsersForAssignment,
  InventoryUser,
} from "@/lib/services/inventories";

/**
 * Query keys for inventory users
 */
export const inventoryUsersKeys = {
  all: ['inventoryUsers'] as const,
  list: (inventoryId: number) => [...inventoryUsersKeys.all, inventoryId] as const,
  availableUsers: ['availableUsers'] as const,
};

/**
 * Hook to fetch users assigned to an inventory
 */
export function useInventoryUsers(inventoryId: number) {
  return useQuery<InventoryUser[], Error>({
    queryKey: inventoryUsersKeys.list(inventoryId),
    queryFn: () => fetchInventoryUsers(inventoryId),
    enabled: !!inventoryId,
  });
}

/**
 * Hook to fetch all users available for assignment
 */
export function useUsersForAssignment(options?: { enabled?: boolean }) {
  return useQuery<InventoryUser[], Error>({
    queryKey: inventoryUsersKeys.availableUsers,
    queryFn: fetchUsersForAssignment,
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change often
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to sync (assign) users to an inventory
 */
export function useSyncInventoryUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryId, userIds }: { inventoryId: number; userIds: number[] }) =>
      syncInventoryUsers(inventoryId, userIds),
    onSuccess: (_, variables) => {
      // Invalidate the inventory users list to refetch
      queryClient.invalidateQueries({ queryKey: inventoryUsersKeys.list(variables.inventoryId) });
    },
  });
}
