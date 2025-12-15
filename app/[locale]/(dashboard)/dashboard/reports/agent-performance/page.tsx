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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  User,
  Package,
  DollarSign,
  Calendar,
  RefreshCw,
  Search,
  Truck,
  CheckCircle,
  Filter,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchAgentPerformance,
  AgentPerformanceItem,
  ReportFilters,
  ReportPeriod,
  REPORT_PERIODS,
  getAgentDisplayName,
} from "@/lib/services/reports";
import { cn } from "@/lib/utils";
import { getBackendImageUrl } from "@/components/ui/backend-image";

export default function AgentPerformancePage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Permission check
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.VIEW_AGENT_PERFORMANCE] });

  // Filters state
  const [period, setPeriod] = useState<ReportPeriod>('all_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
    queryKey: ['agentPerformance', period, startDate, endDate],
    queryFn: () => fetchAgentPerformance(getFilters()),
    enabled: hasPermission === true,
  });

  // Filter data by search
  const filteredData = data?.data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      item.agent_name.toLowerCase().includes(search) ||
      item.agent.name_en.toLowerCase().includes(search) ||
      item.agent.name_ar.toLowerCase().includes(search) ||
      item.agent.email.toLowerCase().includes(search)
    );
  }) || [];

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, item) => ({
      totalOrders: acc.totalOrders + item.total_orders_count,
      pickupOrders: acc.pickupOrders + item.pickup_orders_count,
      deliveredOrders: acc.deliveredOrders + item.delivered_orders_count,
      totalCollected: acc.totalCollected + item.total_collected,
    }),
    { totalOrders: 0, pickupOrders: 0, deliveredOrders: 0, totalCollected: 0 }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('agentPerformance.title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('agentPerformance.subtitle')}
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

              {/* Search */}
              <div className="flex-1 space-y-2">
                <Label>{t('search')}</Label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchAgent')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>

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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">{t('pickupOrders')}</p>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : totals.pickupOrders.toLocaleString()}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('deliveredOrders')}</p>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : totals.deliveredOrders.toLocaleString()}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalCollected')}</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalCollected)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
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
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noData')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('noAgentsFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item) => (
            <AgentPerformanceCard key={item.agent_id} item={item} locale={locale} t={t} tCommon={tCommon} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AgentPerformanceCardProps {
  item: AgentPerformanceItem;
  locale: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

function AgentPerformanceCard({ item, locale, t, tCommon }: AgentPerformanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const agentName = getAgentDisplayName(item.agent, locale);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Agent Info */}
          <div className="flex items-center gap-4 p-5 lg:w-1/4 lg:border-e border-b lg:border-b-0">
            <Avatar className="h-14 w-14 flex-shrink-0">
              {item.agent.avatar ? (
                <AvatarImage src={getBackendImageUrl(item.agent.avatar)} alt={agentName} />
              ) : null}
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {getInitials(agentName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{agentName}</h3>
              <p className="text-sm text-muted-foreground truncate">{item.agent.email}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            {/* Total Orders */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                {t('totalOrders')}
              </div>
              <p className="text-lg font-bold">
                {item.total_orders_count.toLocaleString()}
              </p>
            </div>

            {/* Pickup Orders */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {t('pickupOrders')}
              </div>
              <p className="text-lg font-bold text-orange-600">
                {item.pickup_orders_count.toLocaleString()}
              </p>
            </div>

            {/* Delivered Orders */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('deliveredOrders')}
              </div>
              <p className="text-lg font-bold text-green-600">
                {item.delivered_orders_count.toLocaleString()}
              </p>
            </div>

            {/* Total Collected */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                {t('totalCollected')}
              </div>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(item.total_collected)} <span className="text-xs font-normal">{tCommon('egp')}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
