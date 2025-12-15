"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Building2,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Activity,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchAnalyticsDashboard, type AnalyticsDashboard } from "@/lib/services/analytics";
import { BackendImage } from "@/components/ui/backend-image";
import { cn } from "@/lib/utils";

// Period options matching backend API
type PeriodOption = "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "last_month" | "this_year" | "all_time" | "custom";

export default function AnalyticsPage() {
  const t = useTranslations("analyticsPage");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Filter state
  const [period, setPeriod] = useState<PeriodOption>("all_time");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Check if user has permission to view analytics
  const hasPermission = usePagePermission({
    requiredPermissions: ["view-analytics", "view_analytics"],
  });

  // Build query parameters
  const getQueryParams = () => {
    if (period === "custom" && startDate && endDate) {
      return { period: undefined, startDate, endDate };
    }
    return { period: period !== "custom" ? period : undefined, startDate: undefined, endDate: undefined };
  };

  const queryParams = getQueryParams();

  // Fetch analytics data
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<AnalyticsDashboard>({
    queryKey: ["analyticsDashboard", period, startDate, endDate],
    queryFn: () => fetchAnalyticsDashboard(queryParams.period, queryParams.startDate, queryParams.endDate),
    enabled: hasPermission === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(num);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    return t("daysAgo", { count: diffDays });
  };

  // Show loading while checking permissions
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Permission denied is handled by usePagePermission hook
  if (hasPermission === false) {
    return null;
  }

  const stats = analytics?.dashboard_stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {tCommon("filters")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Period Select */}
              <div className="flex-1 space-y-2">
                <Label>{tCommon("period")}</Label>
                <Select value={period} onValueChange={(value: PeriodOption) => setPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon("selectPeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_time">{t("allTime")}</SelectItem>
                    <SelectItem value="today">{t("today")}</SelectItem>
                    <SelectItem value="yesterday">{t("yesterday")}</SelectItem>
                    <SelectItem value="last_7_days">{t("last7Days")}</SelectItem>
                    <SelectItem value="last_30_days">{t("last30Days")}</SelectItem>
                    <SelectItem value="this_month">{t("thisMonth")}</SelectItem>
                    <SelectItem value="last_month">{t("lastMonth")}</SelectItem>
                    <SelectItem value="this_year">{t("thisYear")}</SelectItem>
                    <SelectItem value="custom">{t("customRange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {period === "custom" && (
                <>
                  <div className="flex-1 space-y-2">
                    <Label>{tCommon("startDate")}</Label>
                    <div className="relative">
                      <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="ps-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>{tCommon("endDate")}</Label>
                    <div className="relative">
                      <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="ps-10"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Apply Button */}
              <Button
                onClick={() => refetch()}
                disabled={isRefetching || (period === "custom" && (!startDate || !endDate))}
                className="gap-2"
              >
                {isRefetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {tCommon("apply")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive">{t("errorLoading")}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <p className="text-3xl font-bold">{formatNumber(stats?.total_orders || 0)}</p>
                )}
                <p className="text-sm font-medium text-muted-foreground">{t("totalOrders")}</p>
              </div>
              <div className="text-end space-y-1">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {formatNumber(stats?.completed_orders || 0)} {t("completedOrders")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stats?.total_revenue || 0)}
                  </p>
                )}
                <p className="text-sm font-medium text-muted-foreground">{t("totalRevenue")}</p>
              </div>
              <span className="text-sm text-muted-foreground">{tCommon("egp")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.success_rate || 0}%
                  </p>
                )}
                <p className="text-sm font-medium text-muted-foreground">{t("successRate")}</p>
              </div>
              <div className="h-12 w-12 flex items-center justify-center">
                {(stats?.success_rate || 0) >= 80 ? (
                  <ArrowUpRight className="h-6 w-6 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Delivery Time */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  <p className="text-3xl font-bold">
                    {(stats?.average_delivery_time_hours || 0).toFixed(1)}
                  </p>
                )}
                <p className="text-sm font-medium text-muted-foreground">{t("avgDeliveryTime")}</p>
              </div>
              <span className="text-sm text-muted-foreground">{t("hours")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Vendors */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{formatNumber(stats?.total_vendors || 0)}</p>
                )}
                <p className="text-xs text-muted-foreground">{t("totalVendors")}</p>
              </div>
              <Badge variant="outline" className="ms-auto">
                {formatNumber(stats?.active_vendors || 0)} {t("activeVendors")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Agents */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Truck className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{formatNumber(stats?.total_agents || 0)}</p>
                )}
                <p className="text-xs text-muted-foreground">{t("totalAgents")}</p>
              </div>
              <Badge variant="outline" className="ms-auto">
                {formatNumber(stats?.active_agents || 0)} {t("activeAgents")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-amber-600">
                    {formatNumber(stats?.pending_orders || 0)} <span className="text-base font-medium">{t("orders")}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t("pendingOrders")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(stats?.cancelled_orders || 0)} <span className="text-base font-medium">{t("orders")}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t("cancelledOrders")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{t("ordersByStatus")}</CardTitle>
                <CardDescription>{t("ordersByStatusDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.orders_analytics?.by_status?.map((status) => (
                  <div key={status.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            status.status === "completed" && "bg-emerald-500",
                            status.status === "pending" && "bg-amber-500",
                            status.status === "in_transit" && "bg-blue-500",
                            status.status === "cancelled" && "bg-red-500"
                          )}
                        />
                        <span className="capitalize">
                          {t(status.status === "in_transit" ? "inTransit" : status.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatNumber(status.count)}</span>
                        <span className="text-muted-foreground">({status.percentage}%)</span>
                      </div>
                    </div>
                    <Progress
                      value={status.percentage}
                      className={cn(
                        "h-2",
                        status.status === "completed" && "[&>div]:bg-emerald-500",
                        status.status === "pending" && "[&>div]:bg-amber-500",
                        status.status === "in_transit" && "[&>div]:bg-blue-500",
                        status.status === "cancelled" && "[&>div]:bg-red-500"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{t("revenueAnalytics")}</CardTitle>
                <CardDescription>{t("revenueAnalyticsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">{t("totalRevenue")}</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(analytics?.revenue_analytics?.summary?.total_revenue || 0)}{" "}
                    {tCommon("egp")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{t("shippingFees")}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(analytics?.revenue_analytics?.summary?.shipping_fees || 0)}{" "}
                    {tCommon("egp")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">{t("codCollected")}</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(analytics?.revenue_analytics?.summary?.cod_collected || 0)}{" "}
                    {tCommon("egp")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">{t("vendorPayouts")}</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(analytics?.revenue_analytics?.summary?.vendor_payouts || 0)}{" "}
                    {tCommon("egp")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors & Top Agents */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-lg">{t("topVendors")}</CardTitle>
                <CardDescription>{t("topVendorsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics?.top_vendors?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{t("noVendors")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.top_vendors?.map((vendor, index) => (
                  <div
                    key={vendor.vendor_id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0",
                        index === 0 && "bg-amber-500 text-white",
                        index === 1 && "bg-gray-400 text-white",
                        index === 2 && "bg-orange-600 text-white",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}
                    >
                      {index === 0 ? <Trophy className="h-4 w-4" /> : vendor.rank}
                    </div>
                    {/* Vendor Logo */}
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {vendor.logo_url ? (
                        <BackendImage
                          src={vendor.logo_url}
                          alt={isRtl ? vendor.vendor_name_ar : vendor.vendor_name_en}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isRtl ? vendor.vendor_name_ar : vendor.vendor_name_en}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatNumber(vendor.total_orders)} {t("orders")}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600">{vendor.success_rate}% {t("successRateShort")}</span>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(vendor.total_revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">{tCommon("egp")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              <div>
                <CardTitle className="text-lg">{t("topAgents")}</CardTitle>
                <CardDescription>{t("topAgentsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics?.agents_analytics?.top_agents?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{t("noAgents")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.agents_analytics?.top_agents?.map((agent, index) => (
                  <div
                    key={agent.agent_id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold flex-shrink-0",
                        index === 0 && "bg-amber-500 text-white",
                        index === 1 && "bg-gray-400 text-white",
                        index === 2 && "bg-orange-600 text-white",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}
                    >
                      {index === 0 ? <Trophy className="h-5 w-5" /> : agent.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isRtl ? agent.agent_name_ar : agent.agent_name_en}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatNumber(agent.total_deliveries)} {t("deliveries")}
                        </span>
                        <span>•</span>
                        <span>
                          {formatNumber(agent.pickup_orders)} {t("pickups")}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600">{agent.success_rate}%</span>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="font-bold text-cyan-600">
                        {formatCurrency(agent.total_collected)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("collected")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Analytics & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Geographic Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-500" />
              <div>
                <CardTitle className="text-lg">{t("geographicAnalytics")}</CardTitle>
                <CardDescription>{t("geographicAnalyticsDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics?.geographic_analytics?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{t("noGeographicData")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.geographic_analytics?.map((geo) => (
                  <div
                    key={geo.location}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        <span className="font-medium">
                          {isRtl ? geo.location_ar : geo.location}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {geo.percentage_of_total}% {t("shareOfTotal")}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("orderCount")}</p>
                        <p className="font-semibold">{formatNumber(geo.total_orders)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("completedCount")}</p>
                        <p className="font-semibold text-emerald-600">
                          {formatNumber(geo.completed_orders)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("revenueAmount")}</p>
                        <p className="font-semibold">
                          {formatCurrency(geo.revenue)} {tCommon("egp")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={geo.success_rate} className="h-2 [&>div]:bg-emerald-500" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {geo.success_rate}% {t("successRate")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">{t("activityFeed")}</CardTitle>
                <CardDescription>{t("activityFeedDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics?.activity_feed?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{t("noActivity")}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {analytics?.activity_feed?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        activity.type === "order_completed" && "bg-emerald-100 dark:bg-emerald-900/30",
                        activity.type === "order_created" && "bg-blue-100 dark:bg-blue-900/30",
                        activity.type === "order_cancelled" && "bg-red-100 dark:bg-red-900/30"
                      )}
                    >
                      {activity.type === "order_completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : activity.type === "order_cancelled" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Package className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isRtl ? activity.title_ar : activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isRtl ? activity.description_ar : activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
