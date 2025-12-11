"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Cache time constants (in milliseconds)
 */
export const CACHE_TIMES = {
  /** Static data that rarely changes (roles, permissions, etc.) */
  STATIC: 30 * 60 * 1000, // 30 minutes
  /** Semi-static data (vendors, users list) */
  SEMI_STATIC: 5 * 60 * 1000, // 5 minutes
  /** Dynamic data (orders, inventory) */
  DYNAMIC: 2 * 60 * 1000, // 2 minutes
  /** Real-time data (current user, notifications) */
  REALTIME: 30 * 1000, // 30 seconds
} as const;

/**
 * Stale time constants - when data should be refetched in background
 */
export const STALE_TIMES = {
  STATIC: 10 * 60 * 1000, // 10 minutes
  SEMI_STATIC: 2 * 60 * 1000, // 2 minutes
  DYNAMIC: 30 * 1000, // 30 seconds
  REALTIME: 10 * 1000, // 10 seconds
} as const;

/**
 * Query keys for type-safe cache invalidation
 */
export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
  // Vendors
  vendors: {
    all: ["vendors"] as const,
    lists: () => [...queryKeys.vendors.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.vendors.details(), id] as const,
    current: () => [...queryKeys.vendors.all, "current"] as const,
  },
  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.orders.details(), id] as const,
    stats: () => [...queryKeys.orders.all, "stats"] as const,
  },
  // Inventory
  inventory: {
    all: ["inventory"] as const,
    lists: () => [...queryKeys.inventory.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.inventory.lists(), filters] as const,
    details: () => [...queryKeys.inventory.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.inventory.details(), id] as const,
  },
  // Roles & Permissions (static data)
  roles: {
    all: ["roles"] as const,
    list: () => [...queryKeys.roles.all, "list"] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    list: () => [...queryKeys.permissions.all, "list"] as const,
  },
  // Locations (static data)
  locations: {
    all: ["locations"] as const,
    governorates: () => [...queryKeys.locations.all, "governorates"] as const,
    cities: (governorateId?: number) => [...queryKeys.locations.all, "cities", governorateId] as const,
  },
  // Analytics
  analytics: {
    all: ["analytics"] as const,
    dashboard: () => [...queryKeys.analytics.all, "dashboard"] as const,
    vendorStats: (vendorId?: number) => [...queryKeys.analytics.all, "vendor", vendorId] as const,
  },
} as const;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data is fresh for 1 minute
        staleTime: 60 * 1000,
        // Default cache time - keep in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
        // Refetch on window focus for real-time feel
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect by default
        refetchOnReconnect: "always",
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}

/**
 * Helper to get the query client for manual cache operations
 */
export function useQueryClientHelper() {
  const [queryClient] = useState(() => getQueryClient());
  return queryClient;
}
