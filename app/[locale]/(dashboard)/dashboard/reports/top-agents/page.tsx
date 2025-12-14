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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  DollarSign,
  Calendar,
  RefreshCw,
  Trophy,
  Medal,
  Award,
  Crown,
  Truck,
  CheckCircle,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchTopAgents,
  ReportFilters,
  ReportPeriod,
  REPORT_PERIODS,
  getAgentDisplayName,
} from "@/lib/services/reports";
import { cn } from "@/lib/utils";
import { getBackendImageUrl } from "@/components/ui/backend-image";

export default function TopAgentsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();

  // Permission check
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.VIEW_TOP_AGENTS] });

  // Filters state
  const [period, setPeriod] = useState<ReportPeriod | ''>('this_month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
    queryKey: ['topAgents', period, fromDate, toDate],
    queryFn: () => fetchTopAgents(getFilters()),
    enabled: hasPermission === true,
  });

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('topAgents.title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('topAgents.subtitle')}
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
          <div className="grid gap-4 md:grid-cols-3">
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

      {/* Top Agents List */}
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
            <p className="text-sm text-muted-foreground mt-2">{t('noAgentsFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.data.map((item, index) => (
            <Card
              key={item.agent_id}
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

                  {/* Agent Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      {item.agent.avatar ? (
                        <AvatarImage src={getBackendImageUrl(item.agent.avatar)} alt={getAgentDisplayName(item.agent, locale)} />
                      ) : null}
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                        {getInitials(getAgentDisplayName(item.agent, locale))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{getAgentDisplayName(item.agent, locale)}</h3>
                      <p className="text-sm text-muted-foreground truncate">{item.agent.email}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {t('pickupOrders')}
                      </p>
                      <p className="font-semibold text-orange-600">{item.pickup_orders_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('deliveredOrders')}
                      </p>
                      <p className="font-semibold text-green-600">{item.delivered_orders_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {t('totalCollected')}
                      </p>
                      <p className="font-bold text-emerald-600 text-lg">{formatCurrency(item.total_collected)}</p>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden text-end">
                    <p className="font-bold text-emerald-600">{formatCurrency(item.total_collected)}</p>
                    <p className="text-xs text-muted-foreground">{item.total_orders_count} {t('orders')}</p>
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
