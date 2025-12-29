"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import { PAGINATION } from "@/lib/constants/pagination";
import {
  fetchOrders,
  fetchOrder,
  fetchMyAssignedOrders,
  createOrder,
  acceptOrder,
  rejectOrder,
  assignPickupAgent,
  assignDeliveryAgent,
  fetchOrderAssignments,
  Order,
  OrdersResponse,
  OrderFilters,
  Assignment,
  CreateOrderRequest,
} from "@/lib/services/orders";

// Re-export types for convenience
export type { Order, OrdersResponse, OrderFilters };

/**
 * Hook to fetch orders with pagination and filters
 * Orders are dynamic data - cached for 2 minutes
 */
export function useOrders(
  page: number = 1,
  perPage: number = PAGINATION.ORDERS,
  filters: OrderFilters = {}
) {
  return useQuery<OrdersResponse, Error>({
    queryKey: queryKeys.orders.list({ page, perPage, ...filters }),
    queryFn: () => fetchOrders(page, perPage, filters),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch orders assigned to current shipping agent
 */
export function useMyAssignedOrders() {
  return useQuery<Order[], Error>({
    queryKey: [...queryKeys.orders.all, "my-assigned"],
    queryFn: fetchMyAssignedOrders,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: number) {
  return useQuery<Order, Error>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => fetchOrder(id),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to fetch order assignments
 */
export function useOrderAssignments(orderId: number) {
  return useQuery<Assignment[], Error>({
    queryKey: [...queryKeys.orders.detail(orderId), "assignments"],
    queryFn: () => fetchOrderAssignments(orderId),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    enabled: !!orderId && !isNaN(orderId),
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => createOrder(orderData),
    onSuccess: () => {
      // Invalidate all order lists
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

/**
 * Hook to accept an order
 */
export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, inventoryId }: { id: number; inventoryId: number }) =>
      acceptOrder(id, inventoryId),
    onSuccess: (updatedOrder, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(variables.id), updatedOrder);

      // Update the order in all list caches immediately for instant UI update
      queryClient.setQueriesData<OrdersResponse>(
        { queryKey: queryKeys.orders.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((order) =>
              order.id === variables.id ? { ...order, ...updatedOrder } : order
            ),
          };
        }
      );

      // Also refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
    },
  });
}

/**
 * Hook to reject an order
 */
export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      rejectOrder(id, reason),
    onSuccess: (updatedOrder, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(variables.id), updatedOrder);

      // Update the order in all list caches immediately for instant UI update
      queryClient.setQueriesData<OrdersResponse>(
        { queryKey: queryKeys.orders.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((order) =>
              order.id === variables.id ? { ...order, ...updatedOrder } : order
            ),
          };
        }
      );

      // Also refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
    },
  });
}

/**
 * Hook to assign pickup agent
 */
export function useAssignPickupAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      agentId,
      notes,
    }: {
      orderId: number;
      agentId: number;
      notes?: string;
    }) => assignPickupAgent(orderId, agentId, notes),
    onSuccess: async (newAssignment, variables) => {
      // Update the order in all list caches with the new assignment immediately
      queryClient.setQueriesData<OrdersResponse>(
        { queryKey: queryKeys.orders.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((order) => {
              if (order.id === variables.orderId) {
                // Add or update the assignment in the order's assignments array
                const existingAssignments = order.assignments || [];
                const updatedAssignments = existingAssignments.some(
                  (a) => a.id === newAssignment.id
                )
                  ? existingAssignments.map((a) =>
                      a.id === newAssignment.id ? newAssignment : a
                    )
                  : [...existingAssignments, newAssignment];
                return {
                  ...order,
                  assignments: updatedAssignments,
                  can_assign_pickup_agent: false, // Typically can't assign again after assignment
                };
              }
              return order;
            }),
          };
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Invalidate my assigned orders
      queryClient.invalidateQueries({ queryKey: [...queryKeys.orders.all, "my-assigned"] });
    },
  });
}

/**
 * Hook to assign delivery agent
 */
export function useAssignDeliveryAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      agentId,
      notes,
    }: {
      orderId: number;
      agentId: number;
      notes?: string;
    }) => assignDeliveryAgent(orderId, agentId, notes),
    onSuccess: async (newAssignment, variables) => {
      // Update the order in all list caches with the new assignment immediately
      queryClient.setQueriesData<OrdersResponse>(
        { queryKey: queryKeys.orders.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((order) => {
              if (order.id === variables.orderId) {
                // Add or update the assignment in the order's assignments array
                const existingAssignments = order.assignments || [];
                const updatedAssignments = existingAssignments.some(
                  (a) => a.id === newAssignment.id
                )
                  ? existingAssignments.map((a) =>
                      a.id === newAssignment.id ? newAssignment : a
                    )
                  : [...existingAssignments, newAssignment];
                return {
                  ...order,
                  assignments: updatedAssignments,
                  can_assign_delivery_agent: false, // Typically can't assign again after assignment
                };
              }
              return order;
            }),
          };
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Invalidate my assigned orders
      queryClient.invalidateQueries({ queryKey: [...queryKeys.orders.all, "my-assigned"] });
    },
  });
}

/**
 * Hook to prefetch an order (for hover/preload scenarios)
 */
export function usePrefetchOrder() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.orders.detail(id),
      queryFn: () => fetchOrder(id),
      staleTime: STALE_TIMES.DYNAMIC,
    });
  };
}

/**
 * Hook to invalidate order caches (useful after external updates)
 */
export function useInvalidateOrders() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() }),
    invalidateOrder: (id: number) => queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() }),
  };
}
