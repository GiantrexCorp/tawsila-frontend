"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUserProfile, CurrentUserProfile } from '@/lib/services/users';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

/**
 * Get cached permissions from localStorage (set during login)
 * This provides instant access to permissions without waiting for API
 */
function getCachedPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  const user = getCurrentUser();
  return user?.roles_permissions || [];
}

/**
 * All available permissions in the system
 */
export const PERMISSIONS = {
  // Users
  LIST_USERS: 'list-users',
  CREATE_USER: 'create-user',
  UPDATE_USER: 'update-user',
  SHOW_USER: 'show-user',
  CHANGE_USER_PASSWORD: 'change-user-password',
  ASSIGN_USER_ROLE: 'assign-user-role',

  // Roles
  LIST_ROLES: 'list-roles',
  CREATE_ROLE: 'create-role',
  UPDATE_ROLE: 'update-role',
  SHOW_ROLE: 'show-role',
  DELETE_ROLE: 'delete-role',

  // Vendors
  LIST_VENDORS: 'list-vendors',
  CREATE_VENDOR: 'create-vendor',
  UPDATE_VENDOR: 'update-vendor',
  SHOW_VENDOR: 'show-vendor',

  // Orders
  LIST_ORDERS: 'list-orders',
  CREATE_ORDER: 'create-order',
  ACCEPT_ORDER: 'accept-order',
  ASSIGN_PICKUP_AGENT: 'assign-pickup-agent',
  SCAN_ORDER_INVENTORY: 'scan-order-inventory',
  SCAN_ORDER_DELIVERY: 'scan-order-delivery',
  ASSIGN_DELIVERY_AGENT: 'assign-delivery-agent',
  PICKUP_ORDER_FROM_VENDOR: 'pickup-order-from-vendor',
  PICKUP_ORDER_FROM_INVENTORY: 'pickup-order-from-inventory',
  VERIFY_ORDER_OTP: 'verify-order-otp',

  // Inventories
  LIST_INVENTORIES: 'list-inventories',
  CREATE_INVENTORY: 'create-inventory',
  UPDATE_INVENTORY: 'update-inventory',
  SHOW_INVENTORY: 'show-inventory',
  DELETE_INVENTORY: 'delete-inventory',
  ASSIGN_INVENTORY_USERS: 'assign-inventory-users',

  // Wallets
  LIST_WALLETS: 'list-wallets',
  SHOW_WALLET: 'show-wallet',

  // Transactions
  LIST_TRANSACTIONS: 'list-transactions',
  SHOW_TRANSACTION: 'show-transaction',

  // Adjustments
  CREATE_ADJUSTMENT: 'create-adjustment',
} as const;

/**
 * Permission groups by module - used to determine sidebar visibility
 * If user has ANY permission in a group, they can see that module
 */
export const PERMISSION_MODULES = {
  USERS: [
    PERMISSIONS.LIST_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.SHOW_USER,
    PERMISSIONS.CHANGE_USER_PASSWORD,
    PERMISSIONS.ASSIGN_USER_ROLE,
  ],
  ROLES: [
    PERMISSIONS.LIST_ROLES,
    PERMISSIONS.CREATE_ROLE,
    PERMISSIONS.UPDATE_ROLE,
    PERMISSIONS.SHOW_ROLE,
    PERMISSIONS.DELETE_ROLE,
  ],
  VENDORS: [
    PERMISSIONS.LIST_VENDORS,
    PERMISSIONS.CREATE_VENDOR,
    PERMISSIONS.UPDATE_VENDOR,
    PERMISSIONS.SHOW_VENDOR,
  ],
  ORDERS: [
    PERMISSIONS.LIST_ORDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.ACCEPT_ORDER,
    PERMISSIONS.ASSIGN_PICKUP_AGENT,
    PERMISSIONS.SCAN_ORDER_INVENTORY,
    PERMISSIONS.SCAN_ORDER_DELIVERY,
    PERMISSIONS.ASSIGN_DELIVERY_AGENT,
    PERMISSIONS.PICKUP_ORDER_FROM_VENDOR,
    PERMISSIONS.PICKUP_ORDER_FROM_INVENTORY,
    PERMISSIONS.VERIFY_ORDER_OTP,
  ],
  INVENTORIES: [
    PERMISSIONS.LIST_INVENTORIES,
    PERMISSIONS.CREATE_INVENTORY,
    PERMISSIONS.UPDATE_INVENTORY,
    PERMISSIONS.SHOW_INVENTORY,
    PERMISSIONS.DELETE_INVENTORY,
    PERMISSIONS.ASSIGN_INVENTORY_USERS,
  ],
  WALLETS: [
    PERMISSIONS.LIST_WALLETS,
    PERMISSIONS.SHOW_WALLET,
  ],
  TRANSACTIONS: [
    PERMISSIONS.LIST_TRANSACTIONS,
    PERMISSIONS.SHOW_TRANSACTION,
  ],
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Query key for current user profile/permissions
 */
export const CURRENT_USER_QUERY_KEY = ['currentUser', 'profile'];

/**
 * Hook to fetch current user profile with permissions
 * Uses React Query for caching with aggressive refetch on window focus
 * This ensures permission changes (from role updates) are picked up quickly
 */
export function useCurrentUserProfile() {
  return useQuery<CurrentUserProfile, Error>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUserProfile,
    staleTime: 30 * 1000, // 30 seconds - short stale time for quick permission updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated(),
    retry: 1,
    refetchOnWindowFocus: true, // Always refetch when tab regains focus
    refetchOnMount: true, // Refetch when component mounts
  });
}

/**
 * Hook to get all permissions of the current user
 * Uses cached permissions from login immediately, then syncs with API
 * This ensures UI is never blocked waiting for permissions
 * @returns Object with permissions array, loading state, and error
 */
export function useUserPermissions() {
  const { data, isLoading, error } = useCurrentUserProfile();

  // Use API data if available, otherwise fall back to cached permissions from login
  // This ensures permissions are available instantly on page load
  const apiPermissions = data?.roles_permissions;
  const cachedPermissions = getCachedPermissions();

  // If API returned fresh permissions, sync to localStorage
  // This keeps localStorage up-to-date when permissions change (e.g., role updated)
  if (apiPermissions && apiPermissions.length > 0) {
    // Only update if different from cached
    const permissionsChanged = JSON.stringify(apiPermissions) !== JSON.stringify(cachedPermissions);
    if (permissionsChanged) {
      updateCachedPermissions(apiPermissions);
    }
  }

  const permissions = apiPermissions || cachedPermissions;

  return {
    permissions,
    // Only show loading if we have NO permissions (not even cached)
    isLoading: isLoading && permissions.length === 0,
    error,
  };
}

/**
 * Hook to check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns Object with hasPermission boolean, loading state
 */
export function useHasPermission(permission: Permission | string) {
  const { permissions, isLoading } = useUserPermissions();

  return {
    hasPermission: permissions.includes(permission),
    isLoading,
  };
}

/**
 * Hook to check if the current user has any of the specified permissions
 * @param permissionsToCheck - Array of permissions to check
 * @returns Object with hasAnyPermission boolean, loading state
 */
export function useHasAnyPermission(permissionsToCheck: (Permission | string)[]) {
  const { permissions, isLoading } = useUserPermissions();

  return {
    hasAnyPermission: permissionsToCheck.some(p => permissions.includes(p)),
    isLoading,
  };
}

/**
 * Hook to check if the current user has all of the specified permissions
 * @param permissionsToCheck - Array of permissions to check
 * @returns Object with hasAllPermissions boolean, loading state
 */
export function useHasAllPermissions(permissionsToCheck: (Permission | string)[]) {
  const { permissions, isLoading } = useUserPermissions();

  return {
    hasAllPermissions: permissionsToCheck.every(p => permissions.includes(p)),
    isLoading,
  };
}

/**
 * Hook to get a function that invalidates the current user's permissions cache
 * Call this when roles are updated to refresh permissions across the app
 * @returns Function to invalidate permissions cache
 */
export function useInvalidateUserPermissions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
  };
}

/**
 * Update cached permissions in localStorage
 * Called when API returns fresh permissions to keep localStorage in sync
 */
export function updateCachedPermissions(permissions: string[]): void {
  if (typeof window === 'undefined') return;
  const user = getCurrentUser();
  if (user) {
    user.roles_permissions = permissions;
    localStorage.setItem('user', JSON.stringify(user));
  }
}
