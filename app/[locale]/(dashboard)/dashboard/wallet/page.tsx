"use client";

import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { fetchMyWallet } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: fetchMyWallet,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('noTransactions');
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getBalanceStatus = () => {
    if (!wallet) return { color: 'muted', icon: CircleDollarSign, label: t('loading') };

    if (wallet.balance_status === 'negative') {
      return {
        color: 'destructive',
        bgGradient: 'from-red-500/20 via-red-500/10 to-transparent',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-500',
        icon: AlertTriangle,
        label: t('negativeBalance'),
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      };
    } else if (wallet.balance_status === 'positive') {
      return {
        color: 'success',
        bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-500',
        icon: CheckCircle2,
        label: t('positiveBalance'),
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      };
    }
    return {
      color: 'muted',
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
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || (!isLoading && !wallet)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{t('errorLoading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  const status = getBalanceStatus();
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Balance Card - Modern Glassmorphism Design */}
        <Card className="md:col-span-2 overflow-hidden relative">
          {/* Background Gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            status.bgGradient
          )} />

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center",
                  status.iconBg
                )}>
                  <Wallet className={cn("h-6 w-6", status.iconColor)} />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('currentBalance')}</CardTitle>
                  <CardDescription>{t('balanceDescription')}</CardDescription>
                </div>
              </div>
              <Badge className={status.badgeClass}>
                <StatusIcon className="h-3 w-3 me-1" />
                {status.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Balance Display */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                {wallet.balance < 0 && (
                  <span className="text-2xl font-bold text-destructive">-</span>
                )}
                <span className={cn(
                  "text-5xl md:text-6xl font-bold tracking-tight",
                  wallet.balance < 0 ? "text-destructive" : wallet.balance > 0 ? "text-emerald-600 dark:text-emerald-400" : ""
                )}>
                  {formatCurrency(wallet.balance)}
                </span>
                <span className="text-2xl font-medium text-muted-foreground">{tCommon('egp')}</span>
              </div>

              {wallet.balance < 0 && (
                <p className="text-sm text-destructive/80 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {t('negativeBalanceWarning')}
                </p>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{t('totalCredited')}</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(wallet.total_credited)}</p>
                <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{t('totalDebited')}</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(wallet.total_debited)}</p>
                <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Stats Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('walletSummary')}</CardTitle>
                <CardDescription>{t('quickOverview')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Wallet ID */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('walletId')}</p>
              <p className="text-lg font-mono font-semibold">#{wallet.id}</p>
            </div>

            {/* Last Transaction */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <Clock className="h-3 w-3" />
                {t('lastTransaction')}
              </div>
              <p className="text-sm font-medium">
                {formatDate(wallet.last_transaction_at)}
              </p>
            </div>

            {/* Created Date */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('walletCreated')}</p>
              <p className="text-sm font-medium">
                {formatDate(wallet.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Credit Card */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalCredited')}</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCurrency(wallet.total_credited)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debit Card */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalDebited')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  -{formatCurrency(wallet.total_debited)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-7 w-7 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Balance Card */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('netBalance')}</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  wallet.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {wallet.balance >= 0 ? '+' : ''}{formatCurrency(wallet.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                wallet.balance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                <CircleDollarSign className={cn(
                  "h-7 w-7",
                  wallet.balance >= 0 ? "text-emerald-500" : "text-red-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      {wallet.balance < 0 && (
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
