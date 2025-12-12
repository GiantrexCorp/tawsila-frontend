"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Package,
  ArrowRight,
  AlertCircle,
  Users,
  Building2,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { usePagePermission } from "@/hooks/use-page-permission";
import { getCurrentUser, User } from "@/lib/auth";
import { VendorDashboard } from "@/components/dashboard/vendor-dashboard";
import { OrdersStatsCards } from "@/components/orders/orders-stats-cards";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { useOrders } from "@/hooks/queries/use-orders";
import { useUsers } from "@/hooks/queries/use-users";
import { useInventories } from "@/hooks/queries/use-inventory";
import { useVendors } from "@/hooks/queries/use-vendors";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');
  const tInventory = useTranslations('inventory');
  const tUsers = useTranslations('users');
  const locale = useLocale();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Dashboard is accessible to all authenticated users (no permission required)
  const hasPermission = usePagePermission({ requiredPermissions: [] });

  useEffect(() => {
    setIsHydrated(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Check user roles (must be after hydration)
  const isVendor = isHydrated && user?.roles?.some(r => r.name === 'vendor');
  const isSuperAdmin = isHydrated && user?.roles?.some(r => r.name === 'super-admin');

  // Fetch recent orders (last 10, sorted by created_at desc) - all authenticated users can access this
  const { data: ordersResponse, isLoading: isLoadingOrders } = useOrders(1, 50, {});
  
  // Fetch system counts - ONLY for super-admin (they're the only ones with permission)
  // System stats (users, inventories, vendors) should only be visible to super-admin
  const shouldFetchSystemData = isHydrated && isSuperAdmin;
  
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers(1, 1, {}, {
    enabled: shouldFetchSystemData,
  });
  const { data: inventories, isLoading: isLoadingInventories } = useInventories({}, {
    enabled: shouldFetchSystemData,
  });
  const { data: vendors, isLoading: isLoadingVendors } = useVendors({
    enabled: shouldFetchSystemData,
  });

  // Get display name for vendor dashboard
  const getDisplayName = () => {
    if (!user) return '';
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  // Calculate stats and filter orders (must be before early returns)
  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.meta?.total || 0;

  const stats = useMemo(() => {
    return {
      total: totalOrders,
      pending: orders.filter((o) => o.status === 'pending' || o.status === 'created').length,
      inTransit: orders.filter((o) =>
        ['in_transit', 'picked_up', 'out_for_delivery', 'pickup_assigned'].includes(o.status)
      ).length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders, totalOrders]);

  // Get recent orders (last 10, sorted by created_at desc)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [orders]);

  // Get pending orders requiring action
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) => (o.status === 'pending' || o.status === 'created') && (o.can_accept || o.can_reject)
    );
  }, [orders]);

  // System stats
  const systemStats = useMemo(() => {
    return {
      users: usersResponse?.meta?.total || 0,
      inventories: inventories?.length || 0,
      vendors: vendors?.length || 0,
    };
  }, [usersResponse?.meta?.total, inventories?.length, vendors?.length]);

  // Chart data for order status distribution
  const orderStatusChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order.status_label || order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [orders]);

  // Chart data for orders over time (last 7 days)
  const ordersOverTimeData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map((date) => {
      const dateStr = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      const count = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return (
          orderDate.getDate() === date.getDate() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      }).length;
      return { date: dateStr, orders: count };
    });
  }, [orders, locale]);

  // Chart colors
  const CHART_COLORS = [
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#10b981', // green
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
  ];

  // Show loading while checking permissions
  if (hasPermission === null || !isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show vendor-specific dashboard for vendor users
  if (isVendor) {
    return <VendorDashboard userName={getDisplayName()} />;
  }

  const handleOrderClick = (orderId: number) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('welcome')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards - Available to all authenticated users */}
      <OrdersStatsCards stats={stats} isLoading={isLoadingOrders} t={tOrders} />

      {/* System Stats Cards - ONLY for super-admin */}
      {isSuperAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tUsers('title')}
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{systemStats.users.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tInventory('title')}
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                <Warehouse className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInventories ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{systemStats.inventories.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('vendors')}
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingVendors ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{systemStats.vendors.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section - ONLY for super-admin */}
      {isSuperAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orderStatusDistribution')}</CardTitle>
              <CardDescription>{t('orderStatusDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <Skeleton className="h-[300px] w-full" />
              ) : orderStatusChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>{t('noDataAvailable')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>{t('ordersOverTime')}</CardTitle>
              <CardDescription>{t('ordersOverTimeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <Skeleton className="h-[300px] w-full" />
              ) : ordersOverTimeData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>{t('noDataAvailable')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ordersOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name={tOrders('orders')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Orders Requiring Action */}
      {pendingOrders.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle>{t('pendingOrdersRequiringAction')}</CardTitle>
            </div>
            <CardDescription>{t('pendingOrdersRequiringActionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customer?.name || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-4">
                    <OrderStatusBadge
                      status={order.status}
                      statusLabel={order.status_label}
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
            {pendingOrders.length > 5 && (
              <Button
                asChild
                variant="outline"
                className="w-full mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href="/dashboard/orders?status=pending">
                  {t('viewAllPendingOrders')} ({pendingOrders.length})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tOrders('recentOrders')}</CardTitle>
              <CardDescription>{t('recentOrdersDesc')}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/orders">
                {t('viewAll')} <ArrowRight className="h-4 w-4 ms-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">{tOrders('noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{order.order_number}</p>
                      <OrderStatusBadge
                        status={order.status}
                        statusLabel={order.status_label}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="truncate">{order.customer?.name || '-'}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-4">
                    <p className="font-semibold text-sm">
                      {tCommon('egpSymbol')} {order.total_amount.toFixed(2)}
                    </p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links - Show based on permissions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-base">{tOrders('title')}</CardTitle>
            <CardDescription>{tOrders('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/orders">{tOrders('viewAllOrders')}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Only show inventory link if user has inventory permissions */}
        {user?.roles_permissions?.some(p => 
          ['list-inventories', 'show-inventory'].includes(p)
        ) && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">{tInventory('title')}</CardTitle>
              <CardDescription>{tInventory('subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/inventory">{t('viewInventory')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Only show users link if user has user management permissions (super-admin) */}
        {isSuperAdmin && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">{tUsers('title')}</CardTitle>
              <CardDescription>{tUsers('subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/users">{tUsers('viewAllUsers')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
