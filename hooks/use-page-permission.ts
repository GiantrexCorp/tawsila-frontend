import { useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { useUserPermissions } from './use-permissions';

interface PagePermissionOptions {
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, requires ALL permissions. If false (default), requires ANY permission
}

/**
 * Hook to check if user has permission to access a page
 * Uses live permissions from API (cached with React Query)
 * Redirects to 403 if user doesn't have required permissions
 *
 * @param options - Configuration object with required permissions
 * @returns hasPermission - null (loading), true (allowed), false (denied and redirecting)
 */
export function usePagePermission(options: PagePermissionOptions): boolean | null {
  const router = useRouter();
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  const { requiredPermissions = [], requireAll = false } = options;

  // Calculate permission access
  const hasPermissionAccess = useMemo(() => {
    // If no permissions are specified, allow access
    if (requiredPermissions.length === 0) {
      return true;
    }

    if (requireAll) {
      return requiredPermissions.every(p => userPermissions.includes(p));
    } else {
      return requiredPermissions.some(p => userPermissions.includes(p));
    }
  }, [requiredPermissions, requireAll, userPermissions]);

  // Handle redirect when access is denied
  useEffect(() => {
    // Only redirect when we've finished loading and don't have access
    if (!isLoading && !hasPermissionAccess) {
      router.push('/403');
    }
  }, [isLoading, hasPermissionAccess, router]);

  // Return null while loading
  if (isLoading) {
    return null;
  }

  return hasPermissionAccess;
}
