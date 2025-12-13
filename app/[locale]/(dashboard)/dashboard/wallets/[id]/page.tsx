"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  User,
  Building2,
  MinusCircle,
  Receipt,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  fetchWallet,
  fetchWalletTransactions,
  getWalletOwnerType,
  getWalletOwnerName,
  type Wallet as WalletType,
  type Transaction,
} from "@/lib/services/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";

export default function WalletDetailPage() {
  const params = useParams();
  const walletId = Number(params.id);

  const t = useTranslations('adminWallets');
  const tTrans = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Check if user has permission to view wallet
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.SHOW_WALLET] });

  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current || !walletId) return;

    const loadData = async () => {
      hasLoadedRef.current = true;
      setIsLoading(true);
      setIsLoadingTransactions(true);
      setError(null);

      try {
        // Fetch wallet with walletable info
        const walletData = await fetchWallet(walletId, ['walletable']);
        setWallet(walletData);
        setIsLoading(false);

        // Fetch transactions separately
        try {
          const transactionsData = await fetchWalletTransactions(walletId, { per_page: 10 });
          setTransactions(transactionsData.data);
        } catch (err) {
          console.error('Error loading transactions:', err);
          // Don't fail the whole page if transactions fail
        } finally {
          setIsLoadingTransactions(false);
        }
      } catch (err) {
        console.error('Error loading wallet:', err);
        setError(t('errorLoading'));
        toast.error(t('errorLoading'));
        setIsLoading(false);
        setIsLoadingTransactions(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId]);

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

  const formatShortDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      month: 'short',
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
      icon: MinusCircle,
      label: t('zeroBalance'),
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    };
  };

  const getOwnerTypeIcon = (type: string) => {
    if (type === 'user') return User;
    if (type === 'vendor') return Building2;
    return Wallet;
  };

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
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

  if (error || !wallet) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{error || t('errorLoading')}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/wallets">
                <ArrowLeft className="h-4 w-4 me-2" />
                {t('backToWallets')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getBalanceStatus();
  const StatusIcon = status.icon;
  const ownerType = getWalletOwnerType(wallet.walletable_type);
  const OwnerIcon = getOwnerTypeIcon(ownerType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/wallets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t('walletDetails')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('walletOwner')}: {getWalletOwnerName(wallet, locale)}
          </p>
        </div>
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

        {/* Side Info Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('walletInfo')}</CardTitle>
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

            {/* Owner Type */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('ownerType')}</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  ownerType === 'user' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                )}>
                  <OwnerIcon className={cn(
                    "h-4 w-4",
                    ownerType === 'user' ? 'text-blue-500' : 'text-purple-500'
                  )} />
                </div>
                <span className="text-sm font-medium capitalize">{ownerType}</span>
              </div>
            </div>

            {/* Owner Name */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('owner')}</p>
              <p className="text-sm font-medium">{getWalletOwnerName(wallet, locale)}</p>
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('recentTransactions')}</CardTitle>
                <CardDescription>{t('lastTransactionsDesc')}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/finance/transactions?wallet_id=${wallet.id}`}>
                {t('viewAll')}
                <ExternalLink className="h-4 w-4 ms-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noTransactionsYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      transaction.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.category_label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(transaction.created_at)}
                        {transaction.reference_number && (
                          <span className="ms-2">#{transaction.reference_number}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={cn(
                      "font-semibold",
                      transaction.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)} {tCommon('egp')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tTrans('balanceAfter')}: {formatCurrency(transaction.balance_after)} {tCommon('egp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negative Balance Warning */}
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
                  {t('negativeBalanceAdminInfo')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
