"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BackendImage } from "@/components/ui/backend-image";
import {
  Loader2,
  Building2,
  Calendar,
  RefreshCw,
  Trophy,
  Medal,
  Award,
  Crown,
  Filter,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchTopVendors,
  ReportFilters,
  ReportPeriod,
  REPORT_PERIODS,
  getVendorDisplayName,
} from "@/lib/services/reports";
import { cn } from "@/lib/utils";

export default function TopVendorsPage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Permission check
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.VIEW_TOP_VENDORS] });

  // Filters state
  const [period, setPeriod] = useState<ReportPeriod>('all_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Build filters
  const getFilters = (): ReportFilters => {
    if (period === 'custom' && startDate && endDate) {
      return { period: 'custom', from: startDate, to: endDate };
    }
    return { period };
  };

  // Fetch data
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['topVendors', period, startDate, endDate],
    queryFn: () => fetchTopVendors(getFilters()),
    enabled: hasPermission === true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case 2:
        return "bg-gray-500/10 text-gray-600 border-gray-500/30";
      case 3:
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPermission === false) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('topVendors.title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('topVendors.subtitle')}
          </p>
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
            {t('refresh')}
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
                <Select value={period} onValueChange={(value: ReportPeriod) => setPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon("selectPeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {t(p.labelKey)}
                      </SelectItem>
                    ))}
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

      {/* Top Vendors List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{t('errorLoading')}</p>
          </CardContent>
        </Card>
      ) : !data?.data.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noData')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('noVendorsFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.data.map((item, index) => (
            <Card
              key={item.vendor_id}
              className={cn(
                "group hover:shadow-lg transition-all duration-300 overflow-hidden",
                index === 0 && "border-yellow-500/50 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20",
                index === 1 && "border-gray-400/50 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-950/20",
                index === 2 && "border-amber-500/50 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                        getRankBadgeColor(index + 1)
                      )}
                    >
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Rank Icon */}
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Vendor Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.vendor.logo_url ? (
                        <BackendImage
                          src={item.vendor.logo_url}
                          alt={getVendorDisplayName(item.vendor, locale)}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{getVendorDisplayName(item.vendor, locale)}</h3>
                      <p className="text-sm text-muted-foreground">{item.total_orders_count} {t('orders')}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t('totalRevenue')}</p>
                      <p className="font-semibold text-emerald-600">{formatCurrency(item.total_revenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t('netProfit')}</p>
                      <p className="font-bold text-green-600 text-lg">{formatCurrency(item.net_profit)}</p>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden text-end">
                    <p className="font-bold text-green-600">{formatCurrency(item.net_profit)}</p>
                    <p className="text-xs text-muted-foreground">{t('netProfit')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
