"use client";

import { use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Hash,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Tag,
  FileText,
  User,
  Package,
  CircleDollarSign,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { fetchTransaction, getWalletOwnerName, getWalletOwnerType } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = use(params);
  const transactionId = parseInt(id, 10);

  const t = useTranslations('transactionDetail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  // Permission check
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.SHOW_TRANSACTION] });

  // Fetch transaction
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => fetchTransaction(transactionId),
    enabled: hasPermission === true && !isNaN(transactionId),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (isNaN(transactionId)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{t('invalidId')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{t('errorLoading')}</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              {t('back')}
            </Button>
          </CardContent>
        </Card>
      ) : transaction ? (
        <>
          {/* Transaction Summary Card */}
          <Card className={cn(
            "relative overflow-hidden",
            transaction.type === 'credit'
              ? "border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30"
              : "border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-amber-950/30"
          )}>
            <div className="absolute top-0 end-0 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center",
                    transaction.type === 'credit'
                      ? "bg-emerald-100 dark:bg-emerald-900/50"
                      : "bg-red-100 dark:bg-red-900/50"
                  )}>
                    {transaction.type === 'credit' ? (
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-7 w-7 text-red-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{transaction.type_label}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Hash className="h-3.5 w-3.5" />
                      {transaction.reference_number}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm px-3 py-1",
                    transaction.type === 'credit'
                      ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      : "border-red-500 text-red-700 dark:text-red-400"
                  )}
                >
                  {transaction.category_label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-4xl md:text-5xl font-bold",
                  transaction.type === 'credit'
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
                <span className={cn(
                  "text-xl opacity-70",
                  transaction.type === 'credit'
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {tCommon('egp')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('balanceAfter')}: {formatCurrency(transaction.balance_after)} {tCommon('egp')}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('transactionDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t('referenceNumber')}
                  </span>
                  <span className="font-mono text-sm">{transaction.reference_number}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t('category')}
                  </span>
                  <Badge variant="secondary">{transaction.category_label}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('date')}
                  </span>
                  <span className="text-sm">{formatDate(transaction.created_at)}</span>
                </div>
                {transaction.description && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t('description')}</span>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{transaction.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5" />
                  {t('relatedInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Info */}
                {transaction.wallet && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {t('wallet')}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => router.push(`/dashboard/wallets/${transaction.wallet_id}`)}
                    >
                      {getWalletOwnerName(transaction.wallet, locale)}
                      <Badge variant="outline" className="ms-2 text-xs">
                        {getWalletOwnerType(transaction.wallet.walletable_type) === 'vendor' ? t('vendor') : t('user')}
                      </Badge>
                    </Button>
                  </div>
                )}

                {/* Order Info */}
                {transaction.order && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t('order')}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => router.push(`/dashboard/orders/${transaction.order_id}`)}
                    >
                      #{transaction.order.order_number}
                    </Button>
                  </div>
                )}

                {/* Created By */}
                {transaction.created_by && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('createdBy')}
                    </span>
                    <span className="text-sm">
                      {locale === 'ar' ? transaction.created_by.name_ar : transaction.created_by.name_en}
                    </span>
                  </div>
                )}

                {/* Metadata */}
                {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t('metadata')}</span>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                      {Object.entries(transaction.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
