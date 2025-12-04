"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  BarChart3,
  Settings,
  FileText,
  ChevronDown,
  Truck,
  Users,
  LogOut,
  User,
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');
  const [user, setUser] = React.useState<{
    name: string;
    name_en: string;
    name_ar: string;
    roles: string[];
  } | null>(null);

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser({
        name: currentUser.name,
        name_en: currentUser.name_en,
        name_ar: currentUser.name_ar,
        roles: currentUser.roles,
      });
    }
  }, []);

  // Get the appropriate name based on locale
  const getDisplayName = () => {
    if (!user) return t('user');
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('logoutSuccess'));
      router.push('/login');
    } catch (error: any) {
      toast.error(t('logoutFailed'), {
        description: error.message,
      });
    }
  };

  const getUserInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleDisplay = (roles: string[]) => {
    if (!roles || roles.length === 0) return t('user');
    const role = roles[0];
    // Format role for display
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Check if user has any of the required roles
  const hasPermission = (allowedRoles?: string[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true; // No restriction
    if (!user || !user.roles || user.roles.length === 0) return false;
    
    // Check if user has any of the allowed roles
    return user.roles.some(role => allowedRoles.includes(role));
  };

  const navigation = [
    {
      title: t('overview'),
      items: [
        {
          title: t('dashboard'),
          href: "/dashboard",
          icon: LayoutDashboard,
          allowedRoles: ['super-admin', 'admin', 'manager', 'viewer'], // Only users with roles can access
        },
      ],
    },
    {
      title: t('management'),
      items: [
        {
          title: t('inventory'),
          href: "/dashboard/inventory",
          icon: Package,
          allowedRoles: ['super-admin', 'admin', 'manager'],
        },
        {
          title: t('requests'),
          href: "/dashboard/requests",
          icon: FileText,
          allowedRoles: ['super-admin', 'admin', 'manager'],
        },
        {
          title: t('orders'),
          href: "/dashboard/orders",
          icon: ShoppingCart,
          allowedRoles: ['super-admin', 'admin', 'manager'],
        },
        {
          title: t('agents'),
          href: "/dashboard/agents",
          icon: Truck,
          allowedRoles: ['super-admin', 'admin', 'manager'],
        },
        {
          title: t('organizations'),
          href: "/dashboard/organizations",
          icon: Building2,
          allowedRoles: ['super-admin', 'admin', 'manager'],
        },
      ],
    },
    {
      title: t('analyticsSection'),
      items: [
        {
          title: t('analytics'),
          href: "/dashboard/analytics",
          icon: BarChart3,
          allowedRoles: ['super-admin', 'admin'],
        },
      ],
    },
    {
      title: t('system'),
      items: [
        {
          title: t('users'),
          href: "/dashboard/users",
          icon: Users,
          allowedRoles: ['super-admin'],
        },
        {
          title: t('settings'),
          href: "/dashboard/settings",
          icon: Settings,
          allowedRoles: ['super-admin', 'admin', 'manager', 'viewer'], // Only users with roles can access
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <TawsilaLogo />
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => {
          // Filter items based on user permissions
          const visibleItems = group.items.filter(item => hasPermission(item.allowedRoles));
          
          // Don't render group if no items are visible
          if (visibleItems.length === 0) return null;
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link href={item.href} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent"
              suppressHydrationWarning
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user ? getUserInitials() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-start text-sm">
                <p className="font-medium">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">
                  {user ? getRoleDisplay(user.roles) : t('loading')}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="me-2 h-4 w-4" />
                {t('profile')}
              </Link>
            </DropdownMenuItem>
            {hasPermission(['super-admin', 'admin', 'manager', 'viewer']) && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="me-2 h-4 w-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="me-2 h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
