"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orders, agents, products } from "@/lib/mock-data";
import { Link } from "@/i18n/routing";
import { usePagePermission } from "@/hooks/use-page-permission";
import { getCurrentUser, User } from "@/lib/auth";
import { VendorDashboard } from "@/components/dashboard/vendor-dashboard";

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();

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

  // Check if user is a vendor
  const isVendor = isHydrated && user?.roles?.some(r => r.name === 'vendor');

  // Get display name for vendor dashboard
  const getDisplayName = () => {
    if (!user) return '';
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

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

  // Calculate real metrics
  const pendingDeliveries = orders.filter(o => ['pending', 'confirmed', 'picked_up', 'in_transit'].includes(o.status)).length;
  const activeAgentsCount = agents.filter(a => a.status === 'active').length;
  const lowStockItems = products.filter(p => p.quantity < p.minStock || p.quantity === 0).length;

  const metrics = [
    {
      title: t('pendingDeliveries'),
      value: pendingDeliveries.toString(),
      change: "-3",
      trend: "down" as const,
      icon: ShoppingCart,
      color: "text-orange-600",
    },
    {
      title: t('activeAgents'),
      value: activeAgentsCount.toString(),
      change: "+1",
      trend: "up" as const,
      icon: Truck,
      color: "text-green-600",
    },
    {
      title: t('lowStockAlerts'),
      value: lowStockItems.toString(),
      change: "+1",
      trend: "up" as const,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  // Active deliveries
  const activeDeliveries = orders.filter(o => 
    ['in_transit', 'picked_up', 'confirmed'].includes(o.status)
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_transit: "default",
      pending: "secondary",
      confirmed: "outline",
      delivered: "outline",
      picked_up: "default",
    };

    const label = tOrders(status as 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered');
    return <Badge variant={variants[status] || "default"}>{label}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('welcome')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs flex items-center gap-1 mt-1">
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }
                >
                  {metric.change}
                </span>
                <span className="text-muted-foreground">{t('fromLastWeek')}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:gap-6">
        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">{t('activeDeliveries')}</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {t('ordersInProgress')}
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href="/dashboard/orders">{t('viewAll')}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customerName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(order.status)}
                      {order.assignedAgent && (
                        <span className="text-xs text-muted-foreground">
                          {tOrders('agent')}: {order.assignedAgent}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-medium whitespace-nowrap">{order.totalAmount} {tCommon('egp')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-orange-600" />
              <CardTitle className="text-lg md:text-xl">{t('lowStockAlerts')}</CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              {t('itemsNeedRestock')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products
                .filter(p => p.quantity < p.minStock || p.quantity === 0)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-end shrink-0 ms-4">
                      <p className={`font-bold text-sm md:text-base ${product.quantity === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {product.quantity} / {product.minStock}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('units')}</p>
                    </div>
                  </div>
                ))}
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/dashboard/inventory">{t('viewInventory')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity')}</CardTitle>
          <CardDescription>
            {t('recentActivityDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <div className="h-full w-px bg-border" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{t('orderDelivered')}</p>
                <p className="text-xs text-muted-foreground">Sarah Ibrahim - ORD-2024-004</p>
                <p className="text-xs text-muted-foreground mt-1">1 {t('dayAgo')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-orange-600" />
                <div className="h-full w-px bg-border" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{t('lowStockAlert')}</p>
                <p className="text-xs text-muted-foreground">USB-C Cable 2m - 0 {t('unitsRemaining')}</p>
                <p className="text-xs text-muted-foreground mt-1">2 {t('daysAgo')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('orderPickedUp')}</p>
                <p className="text-xs text-muted-foreground">Ahmed Hassan - ORD-2024-003</p>
                <p className="text-xs text-muted-foreground mt-1">3 {t('daysAgo')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
