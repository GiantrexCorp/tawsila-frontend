"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  Receipt,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { fetchMySummary, type MySummary } from "@/lib/services/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MySummaryPage() {
  const t = useTranslations('mySummary');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [summary, setSummary] = useState<MySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchMySummary();
        setSummary(data);
      } catch (err) {
        console.error('Error loading summary:', err);
        setError(t('errorLoading'));
        toast.error(t('errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [t]);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(numAmount));
  };

  const parseAmount = (amount: string | number): number => {
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 0) {
      return {
        bgGradient: 'from-red-500/20 via-red-500/10 to-transparent',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-500',
        icon: AlertTriangle,
        label: t('negativeBalance'),
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      };
    } else if (balance > 0) {
      return {
        bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-500',
        icon: CheckCircle2,
        label: t('positiveBalance'),
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      };
    }
    return {
      bgGradient: 'from-slate-500/20 via-slate-500/10 to-transparent',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-500',
      icon: CircleDollarSign,
      label: t('zeroBalance'),
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{error || t('errorLoading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBalance = parseAmount(summary.current_balance);
  const totalCredited = parseAmount(summary.total_credited);
  const totalDebited = parseAmount(summary.total_debited);
  const status = getBalanceStatus(currentBalance);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Balance Card */}
        <Card className="overflow-hidden relative">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            status.bgGradient
          )} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", status.iconBg)}>
                  <Wallet className={cn("h-6 w-6", status.iconColor)} />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('currentBalance')}</CardTitle>
                  <CardDescription>{t('currentBalanceDesc')}</CardDescription>
                </div>
              </div>
              <Badge className={status.badgeClass}>
                <StatusIcon className="h-3 w-3 me-1" />
                {status.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              {currentBalance < 0 && (
                <span className="text-2xl font-bold text-destructive">-</span>
              )}
              <span className={cn(
                "text-4xl md:text-5xl font-bold tracking-tight",
                currentBalance < 0 ? "text-destructive" : currentBalance > 0 ? "text-emerald-600 dark:text-emerald-400" : ""
              )}>
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-xl font-medium text-muted-foreground">{tCommon('egp')}</span>
            </div>

            {/* Credit/Debit Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <ArrowDownLeft className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('totalCredited')}</span>
                </div>
                <p className="text-lg font-bold">+{formatCurrency(totalCredited)}</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('totalDebited')}</span>
                </div>
                <p className="text-lg font-bold">-{formatCurrency(totalDebited)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unsettled Balance Card */}
        <Card className="overflow-hidden relative">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            summary.unsettled_balance < 0
              ? "from-amber-500/20 via-amber-500/10 to-transparent"
              : "from-blue-500/20 via-blue-500/10 to-transparent"
          )} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center",
                summary.unsettled_balance < 0 ? "bg-amber-500/20" : "bg-blue-500/20"
              )}>
                <Clock className={cn(
                  "h-6 w-6",
                  summary.unsettled_balance < 0 ? "text-amber-500" : "text-blue-500"
                )} />
              </div>
              <div>
                <CardTitle className="text-lg">{t('unsettledBalance')}</CardTitle>
                <CardDescription>{t('unsettledBalanceDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              {summary.unsettled_balance < 0 && (
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">-</span>
              )}
              <span className={cn(
                "text-4xl md:text-5xl font-bold tracking-tight",
                summary.unsettled_balance < 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
              )}>
                {formatCurrency(summary.unsettled_balance)}
              </span>
              <span className="text-xl font-medium text-muted-foreground">{tCommon('egp')}</span>
            </div>

            {summary.unsettled_balance !== 0 && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('pendingSettlement')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Settlements */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('pendingSettlements')}</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {summary.pending_settlements}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('settlements')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-7 w-7 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Payouts */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalPayouts')}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(summary.total_payouts)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Banknote className="h-7 w-7 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Collections */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalCollections')}</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  {formatCurrency(summary.total_collections)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <PiggyBank className="h-7 w-7 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('netBalance')}</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  currentBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {currentBalance >= 0 ? '+' : ''}{formatCurrency(currentBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                currentBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                <CircleDollarSign className={cn(
                  "h-7 w-7",
                  currentBalance >= 0 ? "text-emerald-500" : "text-red-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Credit/Debit Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('creditDebitBreakdown')}</CardTitle>
                <CardDescription>{t('creditDebitBreakdownDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="font-medium">{t('totalCredited')}</span>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(totalCredited)} {tCommon('egp')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <span className="font-medium">{t('totalDebited')}</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(totalDebited)} {tCommon('egp')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-base">{t('settlementInfo')}</CardTitle>
                <CardDescription>{t('settlementInfoDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">{t('unsettledBalance')}</span>
              <span className={cn(
                "font-bold",
                summary.unsettled_balance < 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
              )}>
                {summary.unsettled_balance < 0 ? '-' : ''}{formatCurrency(summary.unsettled_balance)} {tCommon('egp')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">{t('pendingSettlements')}</span>
              <span className="font-bold">{summary.pending_settlements}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">{t('totalPayouts')}</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(summary.total_payouts)} {tCommon('egp')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">{t('totalCollections')}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {formatCurrency(summary.total_collections)} {tCommon('egp')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning for Negative Balance */}
      {currentBalance < 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">{t('attentionRequired')}</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('negativeBalanceInfo')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
