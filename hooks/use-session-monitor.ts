/**
 * Session Monitor Hook
 * Monitors authentication state and handles automatic logout
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';

export function useSessionMonitor() {
  const router = useRouter();
  const t = useTranslations('login');

  useEffect(() => {
    // Listen for auth logout events
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason;
      
      if (reason === 'unauthorized') {
        toast.error(t('sessionExpired'), {
          description: t('sessionExpiredDesc'),
          duration: 5000,
        });
        
        // Redirect to login (router.push already handles locale)
        router.push('/login');
      }
    };

    window.addEventListener('auth:logout', handleAuthLogout as EventListener);

    // Check session when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Session will be validated on next API call
        // No need to make an explicit call here
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, t]);
}

