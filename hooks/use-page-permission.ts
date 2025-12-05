import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth';

/**
 * Hook to check if user has permission to access a page
 * Redirects to 403 if user doesn't have required role
 * 
 * @param allowedRoles - Array of roles that can access the page
 * @returns hasPermission - null (checking), true (allowed), false (denied and redirecting)
 */
export function usePagePermission(allowedRoles: string[]): boolean | null {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    // If no roles are specified, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
      setHasPermission(true);
      return;
    }

    // Check if user has any of the allowed roles
    const userHasPermission = currentUser?.roles?.some(role => 
      allowedRoles.includes(role)
    ) || false;

    if (!userHasPermission) {
      // User doesn't have permission, redirect to 403
      router.push('/403');
      setHasPermission(false);
    } else {
      setHasPermission(true);
    }
  }, [allowedRoles, router]);

  return hasPermission;
}


