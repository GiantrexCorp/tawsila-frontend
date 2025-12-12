"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionMonitor } from "@/hooks/use-session-monitor";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useRouter } from "@/i18n/routing";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  
  // Monitor session and handle automatic logout
  useSessionMonitor();
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        // Sync token to cookie if not already there (for existing users)
        const token = localStorage.getItem('access_token');
        if (token) {
          // Check if cookie exists
          const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('token='));
          if (!hasCookie) {
            // Sync to cookie
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            document.cookie = `token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
          }
        }
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
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

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


