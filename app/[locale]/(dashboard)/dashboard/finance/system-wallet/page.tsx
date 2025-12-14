"use client";

import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { fetchSystemWallet, SystemWallet } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

export default function SystemWalletPage() {
  const t = useTranslations('systemWallet');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Check if user has permission to view system wallet
  // Also check for 'view_system_wallet' (underscore) in case backend uses different format
  const hasPermission = usePagePermission({
    requiredPermissions: [PERMISSIONS.VIEW_SYSTEM_WALLET, 'view_system_wallet']
  });

  // Fetch system wallet
  const { data: systemWallet, isLoading, error, refetch, isRefetching } = useQuery<SystemWallet>({
    queryKey: ['systemWallet'],
    queryFn: fetchSystemWallet,
    enabled: hasPermission === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Show loading while checking permissions
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Permission denied is handled by usePagePermission hook (redirects to 403)
  if (hasPermission === false) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
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

      {/* Hero Card */}
      <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
        <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('platformBalance')}</CardTitle>
              <CardDescription>{t('platformBalanceDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <Skeleton className="h-16 w-48" />
          ) : error ? (
            <p className="text-destructive">{t('errorLoading')}</p>
          ) : systemWallet ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(systemWallet.balance)}
              </span>
              <span className="text-xl text-emerald-600/70 dark:text-emerald-400/70">
                {tCommon('egp')}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Credited */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('totalCredited')}</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(systemWallet?.total_credited || 0)}
                    <span className="text-lg ms-1 text-emerald-500/70">{tCommon('egp')}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('totalCreditedDesc')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Debited */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-red-200 dark:hover:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('totalDebited')}</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className="text-3xl font-bold text-red-500 dark:text-red-400">
                    -{formatCurrency(systemWallet?.total_debited || 0)}
                    <span className="text-lg ms-1 text-red-500/70">{tCommon('egp')}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('totalDebitedDesc')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 md:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('netProfit')}</p>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <p className={cn(
                    "text-3xl font-bold",
                    (systemWallet?.balance || 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  )}>
                    {(systemWallet?.balance || 0) >= 0 ? '+' : ''}{formatCurrency(systemWallet?.balance || 0)}
                    <span className="text-lg ms-1 opacity-70">{tCommon('egp')}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('netProfitDesc')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{t('howItWorks')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('howItWorksDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
