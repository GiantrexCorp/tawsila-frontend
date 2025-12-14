"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Truck,
  CheckCircle,
  DollarSign,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { fetchMyPerformance, PerformanceFilters } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

type PeriodType = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year';

const PERIODS: { value: PeriodType; labelKey: string }[] = [
  { value: 'this_month', labelKey: 'thisMonth' },
  { value: 'last_month', labelKey: 'lastMonth' },
  { value: 'this_quarter', labelKey: 'thisQuarter' },
  { value: 'last_quarter', labelKey: 'lastQuarter' },
  { value: 'this_year', labelKey: 'thisYear' },
  { value: 'last_year', labelKey: 'lastYear' },
];

export default function MyPerformancePage() {
  const t = useTranslations('myPerformance');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [period, setPeriod] = useState<PeriodType>('this_month');

  const getFilters = (): PerformanceFilters => ({
    period,
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['my-performance', period],
    queryFn: () => fetchMyPerformance(getFilters()),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const performance = data?.data;
  const meta = data?.meta;
  const agentName = performance?.agent
    ? (locale === 'ar' ? performance.agent.name_ar : performance.agent.name_en)
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          {t('refresh')}
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t('period')}
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('selectPeriod')} />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {t(p.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {meta && (
              <div className="text-sm text-muted-foreground">
                {formatDate(meta.from)} - {formatDate(meta.to)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{t('errorLoading')}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      ) : performance ? (
        <>
          {/* Agent Profile Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
            <div className="absolute top-0 end-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg font-semibold bg-primary/20 text-primary">
                    {getInitials(agentName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{agentName}</h2>
                  <p className="text-sm text-muted-foreground">{performance.agent.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{t('deliveryAgent')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Orders */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                    <p className="text-3xl font-bold mt-1">
                      {performance.total_orders_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t('ordersHandled')}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup Orders */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-orange-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('pickupOrders')}</p>
                    <p className="text-3xl font-bold mt-1 text-orange-600">
                      {performance.pickup_orders_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t('pickedUp')}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Truck className="h-7 w-7 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivered Orders */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-green-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('deliveredOrders')}</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">
                      {performance.delivered_orders_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t('successfullyDelivered')}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-7 w-7 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Collected */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-emerald-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalCollected')}</p>
                    <p className="text-3xl font-bold mt-1 text-emerald-600">
                      {formatCurrency(performance.total_collected)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-7 w-7 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      ) : null}
    </div>
  );
}
