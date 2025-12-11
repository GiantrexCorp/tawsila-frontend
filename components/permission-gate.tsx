"use client";

import { ReactNode } from "react";
import { useUserPermissions, Permission } from "@/hooks/use-permissions";

interface PermissionGateProps {
  /** Single permission or array of permissions to check */
  permissions: Permission | Permission[] | string | string[];
  /** If true, user must have ALL permissions. If false (default), user needs ANY permission */
  requireAll?: boolean;
  /** Content to render if user has permission */
  children: ReactNode;
  /** Optional fallback to render if user lacks permission */
  fallback?: ReactNode;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 *
 * @example
 * // Show button only if user can create inventory
 * <PermissionGate permissions={PERMISSIONS.CREATE_INVENTORY}>
 *   <Button>Create Inventory</Button>
 * </PermissionGate>
 *
 * @example
 * // Show button if user has ANY of these permissions
 * <PermissionGate permissions={[PERMISSIONS.UPDATE_USER, PERMISSIONS.DELETE_USER]}>
 *   <Button>Manage User</Button>
 * </PermissionGate>
 *
 * @example
 * // Show button only if user has ALL permissions
 * <PermissionGate permissions={[PERMISSIONS.LIST_USERS, PERMISSIONS.ASSIGN_USER_ROLE]} requireAll>
 *   <Button>Assign Role</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  const hasPermission = requireAll
    ? permissionArray.every((p) => userPermissions.includes(p))
    : permissionArray.some((p) => userPermissions.includes(p));

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook version for more complex conditional logic
 * Returns a function to check permissions
 */
export function usePermissionCheck() {
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  const can = (permission: Permission | string): boolean => {
    if (isLoading) return false;
    return userPermissions.includes(permission);
  };

  const canAny = (permissions: (Permission | string)[]): boolean => {
    if (isLoading) return false;
    return permissions.some((p) => userPermissions.includes(p));
  };

  const canAll = (permissions: (Permission | string)[]): boolean => {
    if (isLoading) return false;
    return permissions.every((p) => userPermissions.includes(p));
  };

  return { can, canAny, canAll, isLoading };
}
