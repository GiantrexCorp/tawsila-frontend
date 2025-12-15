"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { BackendImage } from "@/components/ui/backend-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle2,
  Plus,
  Eye,
  Building2,
  MapPin,
  User,
  Calendar,
  ArrowRight,
  Package,
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  DollarSign,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { fetchCurrentVendor, Vendor } from "@/lib/services/vendors";
import { fetchMyProfitReport, ProfitReport } from "@/lib/services/wallet";
import { useOrders, Order } from "@/hooks/queries/use-orders";

interface VendorDashboardProps {
  userName: string;
}

export function VendorDashboard({ userName }: VendorDashboardProps) {
  const t = useTranslations("vendorDashboard");
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const vendorData = await fetchCurrentVendor();
        setVendor(vendorData);
      } catch (error) {
        console.error("Failed to load vendor:", error);
        // Silently fail - vendor info is optional for dashboard display
      } finally {
        setIsLoading(false);
      }
    };

    loadVendor();
  }, []);

  // Fetch profit report
  const { data: profitReport, isLoading: isLoadingProfitReport } = useQuery<ProfitReport>({
    queryKey: ['myProfitReport'],
    queryFn: fetchMyProfitReport,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch orders for stats and recent orders
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders(1, 100); // Fetch first 100 orders for stats

  // Calculate order stats from fetched orders
  const orderStats = useMemo(() => {
    if (!ordersData?.data) {
      return { total: 0, pending: 0, inTransit: 0, delivered: 0 };
    }

    const orders = ordersData.data;
    return {
      total: ordersData.meta?.total || orders.length,
      pending: orders.filter((o: Order) => o.status === 'pending').length,
      inTransit: orders.filter((o: Order) =>
        ['in_transit', 'picked_up', 'out_for_delivery', 'accepted', 'at_inventory'].includes(o.status)
      ).length,
      delivered: orders.filter((o: Order) => o.status === 'delivered').length,
    };
  }, [ordersData]);

  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    if (!ordersData?.data) return [];

    return ordersData.data
      .slice(0, 5)
      .map((order: Order) => ({
        id: order.order_number,
        orderId: order.id,
        customer: order.customer?.name || '-',
        status: order.status,
        amount: order.total_amount,
        date: new Date(order.created_at),
      }));
  }, [ordersData]);

  const displayName = vendor
    ? locale === "ar"
      ? vendor.name_ar
      : vendor.name_en
    : userName;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_transit: "default",
      out_for_delivery: "default",
      picked_up: "default",
      pending: "secondary",
      accepted: "secondary",
      at_inventory: "secondary",
      delivered: "outline",
      rejected: "destructive",
      cancelled: "destructive",
    };
    const colors: Record<string, string> = {
      in_transit: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      out_for_delivery: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      picked_up: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      pending: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
      accepted: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
      at_inventory: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20",
      delivered: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
      rejected: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
      cancelled: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className={colors[status] || "bg-gray-500/10 text-gray-600"}>
        {tOrders(status as keyof typeof variants) || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-muted">
          {vendor?.cover_image ? (
            <BackendImage
              src={vendor.cover_image}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Profile Content */}
        <div className="relative -mt-16 px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-background shadow-xl ring-4 ring-background overflow-hidden flex items-center justify-center">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : vendor?.logo ? (
                  <BackendImage
                    src={vendor.logo}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                )}
              </div>
              {vendor?.status === "active" && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 ring-4 ring-background" />
              )}
            </div>

            {/* Welcome Text */}
            <div className="flex-1 pt-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t("welcome", { name: displayName })}
              </h1>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 w-full md:w-auto">
              <Button asChild size="lg" className="w-full md:w-auto gap-2">
                <Link href="/dashboard/orders/new">
                  <Plus className="h-4 w-4" />
                  {t("createOrder")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold">{orderStats.total}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{t("allOrders")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-amber-600">{orderStats.pending}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{tOrders("pending")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("inTransitOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{orderStats.inTransit}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{tOrders("inTransit")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("deliveredOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-emerald-600">{orderStats.delivered}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{tOrders("delivered")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Profit Report Section */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>{t("profitReport")}</CardTitle>
              <CardDescription>{t("profitReportDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProfitReport ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : profitReport ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Total Revenue */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-muted-foreground">{t("totalRevenue")}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {tCommon("egpSymbol")} {profitReport.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("totalRevenueDesc")}</p>
              </div>

              {/* COD Revenue */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">{t("codRevenue")}</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {tCommon("egpSymbol")} {profitReport.cod_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{profitReport.cod_order_count} {t("codOrders")}</p>
              </div>

              {/* Prepaid Revenue */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-purple-100 dark:border-purple-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">{t("prepaidRevenue")}</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {tCommon("egpSymbol")} {profitReport.prepaid_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{profitReport.prepaid_order_count} {t("prepaidOrders")}</p>
              </div>

              {/* Shipping Fees Paid */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-red-100 dark:border-red-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-muted-foreground">{t("shippingFeesPaid")}</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {tCommon("egpSymbol")} {profitReport.shipping_fees_paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("shippingFeesPaidDesc")}</p>
              </div>

              {/* Net Profit */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-green-100 dark:border-green-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">{t("netProfit")}</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {tCommon("egpSymbol")} {profitReport.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("netProfitDesc")}</p>
              </div>

              {/* Total Orders Count */}
              <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-muted-foreground">{t("totalOrdersCount")}</span>
                </div>
                <p className="text-2xl font-bold">
                  {profitReport.total_order_count.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {profitReport.cod_order_count} COD + {profitReport.prepaid_order_count} Prepaid
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t("errorLoadingProfitReport")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentOrders")}</CardTitle>
                <CardDescription>{t("recentOrdersDesc")}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/orders" className="gap-2">
                  {t("viewAllOrders")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-20" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.orderId}`}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <div className="text-end">
                        <p className="font-medium">
                          {order.amount.toLocaleString()} {tCommon("egp")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.date.toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">{t("noOrders")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("noOrdersDesc")}</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/orders/new">{t("createOrder")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Business Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/orders/new">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("newOrder")}</p>
                    <p className="text-xs text-muted-foreground">{t("newOrderDesc")}</p>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/orders">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("trackOrders")}</p>
                    <p className="text-xs text-muted-foreground">{t("trackOrdersDesc")}</p>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/my-vendor">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("viewProfile")}</p>
                    <p className="text-xs text-muted-foreground">{t("viewProfileDesc")}</p>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Business Info */}
          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle>{t("businessInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("contactPerson")}</p>
                    <p className="font-medium">{vendor.contact_person}</p>
                  </div>
                </div>
                {vendor.city && vendor.governorate && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("location")}</p>
                      <p className="font-medium">
                        {locale === "ar" ? vendor.city.name_ar : vendor.city.name_en},{" "}
                        {locale === "ar" ? vendor.governorate.name_ar : vendor.governorate.name_en}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("memberSince")}</p>
                    <p className="font-medium">
                      {new Date(vendor.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
