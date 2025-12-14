"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BackendImage } from "@/components/ui/backend-image";
import {
  Loader2,
  Building2,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  RefreshCw,
  Search,
  Truck,
  CreditCard,
  Wallet,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchVendorProfits,
  VendorProfitItem,
  ReportFilters,
  ReportPeriod,
  REPORT_PERIODS,
  getVendorDisplayName,
} from "@/lib/services/reports";
import { cn } from "@/lib/utils";

export default function VendorProfitsPage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Permission check
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.VIEW_VENDOR_PROFITS] });

  // Filters state
  const [period, setPeriod] = useState<ReportPeriod | ''>('this_month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Build filters
  const getFilters = useCallback((): ReportFilters => {
    if (fromDate && toDate) {
      return { from: fromDate, to: toDate };
    }
    if (period) {
      return { period };
    }
    return { period: 'this_month' };
  }, [period, fromDate, toDate]);

  // Fetch data
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vendorProfits', period, fromDate, toDate],
    queryFn: () => fetchVendorProfits(getFilters()),
    enabled: hasPermission === true,
  });

  // Filter data by search
  const filteredData = data?.data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      item.vendor_name.toLowerCase().includes(search) ||
      item.vendor.name_en.toLowerCase().includes(search) ||
      item.vendor.name_ar.toLowerCase().includes(search)
    );
  }) || [];

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, item) => ({
      totalRevenue: acc.totalRevenue + item.total_revenue,
      netProfit: acc.netProfit + item.net_profit,
      totalOrders: acc.totalOrders + item.total_orders_count,
      shippingFees: acc.shippingFees + item.shipping_fees,
    }),
    { totalRevenue: 0, netProfit: 0, totalOrders: 0, shippingFees: 0 }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as ReportPeriod);
    setFromDate('');
    setToDate('');
  };

  const handleCustomDateChange = () => {
    if (fromDate || toDate) {
      setPeriod('');
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('vendorProfits.title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('vendorProfits.subtitle')}
          </p>
        </div>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Period Select */}
            <div className="space-y-2">
              <Label>{t('period')}</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectPeriod')} />
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

            {/* From Date */}
            <div className="space-y-2">
              <Label>{t('fromDate')}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  handleCustomDateChange();
                }}
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label>{t('toDate')}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  handleCustomDateChange();
                }}
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>{t('search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchVendor')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Period Info */}
          {data?.meta && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {t('periodRange')}: {data.meta.from} - {data.meta.to}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalRevenue)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('netProfit')}</p>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.netProfit)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : totals.totalOrders.toLocaleString()}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('shippingFees')}</p>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.shippingFees)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{t('errorLoading')}</p>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noData')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('noVendorsFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item) => (
            <VendorProfitCard key={item.vendor_id} item={item} locale={locale} t={t} tCommon={tCommon} />
          ))}
        </div>
      )}
    </div>
  );
}

interface VendorProfitCardProps {
  item: VendorProfitItem;
  locale: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

function VendorProfitCard({ item, locale, t, tCommon }: VendorProfitCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Vendor Info */}
          <div className="flex items-center gap-4 p-5 lg:w-1/4 lg:border-e border-b lg:border-b-0">
            <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.vendor.logo ? (
                <BackendImage
                  src={item.vendor.logo}
                  alt={getVendorDisplayName(item.vendor, locale)}
                  width={56}
                  height={56}
                  className="object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{getVendorDisplayName(item.vendor, locale)}</h3>
              <p className="text-sm text-muted-foreground">ID: {item.vendor_id}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            {/* Total Revenue */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                {t('totalRevenue')}
              </div>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(item.total_revenue)} <span className="text-xs font-normal">{tCommon('egp')}</span>
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  COD: {formatCurrency(item.cod_revenue)}
                </span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Prepaid: {formatCurrency(item.prepaid_revenue)}
                </span>
              </div>
            </div>

            {/* Shipping Fees */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {t('shippingFees')}
              </div>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(item.shipping_fees)} <span className="text-xs font-normal">{tCommon('egp')}</span>
              </p>
            </div>

            {/* Net Profit */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                {t('netProfit')}
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(item.net_profit)} <span className="text-xs font-normal">{tCommon('egp')}</span>
              </p>
            </div>

            {/* Orders */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {t('orders')}
              </div>
              <p className="text-lg font-bold">
                {item.total_orders_count.toLocaleString()}
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>COD: {item.cod_orders_count}</span>
                <span>Prepaid: {item.prepaid_orders_count}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
