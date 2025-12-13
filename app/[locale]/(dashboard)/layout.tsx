"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionMonitor } from "@/hooks/use-session-monitor";
import { useState, useEffect, useCallback } from "react";
import { isAuthenticated, hasToken, validateSession, clearAuthData } from "@/lib/auth";
import { useSearchParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChecking, setIsChecking] = useState(true);
  const searchParams = useSearchParams();

  // Monitor session and handle automatic logout
  useSessionMonitor();

  // Redirect to login
  const redirectToLogin = useCallback(() => {
    clearAuthData();
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1] || 'en';
    window.location.href = `/${locale}/login`;
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if we need to validate session (redirected from login with stale cookie)
      const needsValidation = searchParams.get('validate') === '1';

      // If fully authenticated and no validation needed, proceed
      if (isAuthenticated() && !needsValidation) {
        setIsChecking(false);
        return;
      }

      // If token exists but user data missing, or validation requested
      if (hasToken()) {
        // Try to validate session with API
        const user = await validateSession();
        if (user) {
          // Session is valid, remove validate param from URL
          if (needsValidation) {
            const url = new URL(window.location.href);
            url.searchParams.delete('validate');
            window.history.replaceState({}, '', url.toString());
          }
          setIsChecking(false);
          return;
        }
      }

      // No valid session - redirect to login
      redirectToLogin();
    };

    checkAuth();
  }, [searchParams, redirectToLogin]);

  // Show loading spinner while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 h-6" />

          {/* Breadcrumb or page title can go here */}
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
