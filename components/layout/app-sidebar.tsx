"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  BarChart3,
  ChevronDown,
  Users,
  LogOut,
  User as UserIcon,
  Shield,
  Wallet,
  Receipt,
  PieChart,
  FileText,
  TrendingUp,
  Trophy,
  Activity,
  Award,
  LucideIcon,
} from "lucide-react";
import { getCurrentUser, logout, User } from "@/lib/auth";
import { getRoleDisplayName } from "@/lib/services/users";
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
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { useUserPermissions, PERMISSION_MODULES, PERMISSIONS } from "@/hooks/use-permissions";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: string[]; // If empty or undefined, accessible to all authenticated users
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<User | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Get user permissions from API (cached)
  const { permissions: userPermissions, isLoading: isLoadingPermissions } = useUserPermissions();

  // Handle hydration - only show permission-based content after hydration
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Get the appropriate name based on locale
  const getDisplayName = () => {
    if (!user) return t('user');
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  const handleLogout = async () => {
    try {
      // Clear all React Query cache before logout to prevent stale data
      queryClient.clear();
      await logout();
      toast.success(t('logoutSuccess'));
      router.push('/login');
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error)
        ? String(error.message)
        : 'Logout failed';
      toast.error(t('logoutFailed'), {
        description: errorMessage,
      });
    }
  };

  const getRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return t('user');
    return getRoleDisplayName(user.roles[0], locale);
  };

  // Check if user has any of the required permissions
  const hasPermission = (requiredPermissions?: string[]) => {
    // If no permissions required, accessible to all authenticated users
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    // If not hydrated yet or still loading permissions, don't show permission-based items
    // This prevents showing all items on first render before permissions are loaded
    if (!isHydrated || (isLoadingPermissions && userPermissions.length === 0)) return false;

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  };

  // Check if user is a vendor (has vendor role) - only used to show vendor profile link
  // Only check after hydration to prevent hydration mismatch
  const isVendor = isHydrated && user?.roles?.some(r => r.name === 'vendor');

  // Check if user is a shipping agent - to show performance link
  const isShippingAgent = isHydrated && user?.roles?.some(r => r.name === 'shipping-agent');

  // Build navigation purely based on permissions
  // Each module is shown if user has ANY permission related to that module
  const navigation: NavGroup[] = [
    // Overview section - always visible to authenticated users
    {
      title: t('overview'),
      items: [
        {
          title: t('dashboard'),
          href: "/dashboard",
          icon: LayoutDashboard,
          // Dashboard is accessible to all authenticated users
        },
      ],
    },
    // Vendor Profile - only for vendor users to access their own profile
    ...(isVendor ? [{
      title: t('myAccount'),
      items: [
        {
          title: t('vendorProfile'),
          href: "/dashboard/my-vendor",
          icon: Building2,
        },
      ],
    }] : []),
    // Management section - permission-based
    {
      title: t('management'),
      items: [
        {
          title: t('inventory'),
          href: "/dashboard/inventory",
          icon: Package,
          // Show if user has ANY inventory permission
          requiredPermissions: [...PERMISSION_MODULES.INVENTORIES],
        },
        {
          title: t('orders'),
          href: "/dashboard/orders",
          icon: ShoppingCart,
          // Show if user has ANY order permission
          requiredPermissions: [...PERMISSION_MODULES.ORDERS],
        },
        {
          title: t('vendors'),
          href: "/dashboard/vendors",
          icon: Building2,
          // Show if user has ANY vendor permission
          requiredPermissions: [...PERMISSION_MODULES.VENDORS],
        },
      ],
    },
    // Finance section - permission-based
    {
      title: t('finance'),
      items: [
        {
          title: t('platformFinances'),
          href: "/dashboard/finance/system-wallet",
          icon: Building2,
          // Show only if user has view-system-wallet permission (check both hyphen and underscore formats)
          requiredPermissions: [PERMISSIONS.VIEW_SYSTEM_WALLET, 'view_system_wallet'],
        },
        {
          title: t('wallets'),
          href: "/dashboard/wallets",
          icon: Wallet,
          // Show if user has ANY wallet permission
          requiredPermissions: [...PERMISSION_MODULES.WALLETS],
        },
        {
          title: t('allTransactions'),
          href: "/dashboard/finance/transactions",
          icon: Receipt,
          // Show if user has ANY transaction permission
          requiredPermissions: [...PERMISSION_MODULES.TRANSACTIONS],
        },
        {
          title: t('settlements'),
          href: "/dashboard/finance/settlements",
          icon: FileText,
          // Show if user has ANY settlement permission
          requiredPermissions: [...PERMISSION_MODULES.SETTLEMENTS],
        },
      ],
    },
    // Reports section - permission-based
    {
      title: t('reports'),
      items: [
        {
          title: t('vendorProfits'),
          href: "/dashboard/reports/vendor-profits",
          icon: TrendingUp,
          requiredPermissions: [PERMISSIONS.VIEW_VENDOR_PROFITS],
        },
        {
          title: t('topVendors'),
          href: "/dashboard/reports/top-vendors",
          icon: Trophy,
          requiredPermissions: [PERMISSIONS.VIEW_TOP_VENDORS],
        },
        {
          title: t('agentPerformance'),
          href: "/dashboard/reports/agent-performance",
          icon: Activity,
          requiredPermissions: [PERMISSIONS.VIEW_AGENT_PERFORMANCE],
        },
        {
          title: t('topAgents'),
          href: "/dashboard/reports/top-agents",
          icon: Award,
          requiredPermissions: [PERMISSIONS.VIEW_TOP_AGENTS],
        },
      ],
    },
    // Analytics section - accessible to all authenticated users (uses dummy data)
    {
      title: t('analyticsSection'),
      items: [
        {
          title: t('analytics'),
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
    // System section - permission-based
    {
      title: t('system'),
      items: [
        {
          title: t('users'),
          href: "/dashboard/users",
          icon: Users,
          // Show if user has ANY user permission
          requiredPermissions: [...PERMISSION_MODULES.USERS],
        },
        {
          title: t('roles'),
          href: "/dashboard/roles",
          icon: Shield,
          // Show if user has ANY role permission
          requiredPermissions: [...PERMISSION_MODULES.ROLES],
        },
      ],
    },
  ];

  // Determine home page - always go to dashboard (accessible to all)
  const getHomePage = () => {
    return '/dashboard';
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href={getHomePage()}>
          <TawsilaLogo />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => {
          // Filter items based on user permissions
          const visibleItems = group.items.filter(item => hasPermission(item.requiredPermissions));

          // Don't render group if no items are visible
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    // Remove locale prefix from pathname for comparison
                    const pathnameWithoutLocale = pathname.replace(/^\/(en|ar)/, '');
                    // For dashboard, only match exact path. For others, match path and sub-paths
                    const isActive = item.href === '/dashboard'
                      ? pathnameWithoutLocale === '/dashboard'
                      : pathnameWithoutLocale === item.href || pathnameWithoutLocale.startsWith(item.href + '/');
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
              <UserAvatar
                userId={user?.id || 0}
                name={getDisplayName()}
                role={user?.roles?.[0]?.name}
                size="sm"
              />
              <div className="flex-1 text-start text-sm">
                <p className="font-medium">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">
                  {user ? getRoleDisplay() : t('loading')}
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
                <UserIcon className="me-2 h-4 w-4" />
                {t('profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/wallet">
                <Wallet className="me-2 h-4 w-4" />
                {t('wallet')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/transactions">
                <Receipt className="me-2 h-4 w-4" />
                {t('transactions')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/summary">
                <PieChart className="me-2 h-4 w-4" />
                {t('summary')}
              </Link>
            </DropdownMenuItem>
            {isShippingAgent && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/performance">
                  <Activity className="me-2 h-4 w-4" />
                  {t('myPerformance')}
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
