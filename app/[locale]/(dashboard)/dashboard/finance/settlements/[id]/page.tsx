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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Loader2,
  Calendar,
  Receipt,
  Sparkles,
  Package,
} from "lucide-react";
import {
  fetchSettlement,
  confirmSettlement,
  cancelSettlement,
  getSettlementSettlebleName,
  getSettlementSettlebleType,
  getSettlementSettlebleRole,
  type Settlement,
} from "@/lib/services/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";

export default function SettlementDetailPage() {
  const params = useParams();
  const settlementId = Number(params.id);

  const t = useTranslations('adminSettlements');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Check if user has permission to view settlement
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.SHOW_SETTLEMENT] });

  // Permission checks
  const { hasPermission: canConfirmSettlement } = useHasPermission(PERMISSIONS.CONFIRM_SETTLEMENT);
  const { hasPermission: canCancelSettlement } = useHasPermission(PERMISSIONS.CANCEL_SETTLEMENT);

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current || !settlementId) return;

    const loadData = async () => {
      hasLoadedRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchSettlement(settlementId, [
          'settleble',
          'items',
          'items.transaction',
          'items.order',
          'confirmedBy',
          'createdBy',
        ]);
        setSettlement(data);
      } catch (err) {
        console.error('Error loading settlement:', err);
        setError(t('errorLoading'));
        toast.error(t('errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementId]);

  // Confirm settlement handler
  const handleConfirm = async () => {
    if (!settlement) return;

    setIsConfirming(true);
    try {
      const updatedSettlement = await confirmSettlement(settlement.id);
      setSettlement(updatedSettlement);
      toast.success(t('confirmSuccess'));
      setShowConfirmDialog(false);
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const apiError = err as { message?: string; errors?: Record<string, string[]> };
        if (apiError.errors) {
          const firstError = Object.values(apiError.errors)[0]?.[0];
          toast.error(firstError || apiError.message || t('confirmFailed'));
        } else if (apiError.message) {
          toast.error(apiError.message);
        } else {
          toast.error(t('confirmFailed'));
        }
      } else {
        toast.error(t('confirmFailed'));
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Cancel settlement handler
  const handleCancel = async () => {
    if (!settlement) return;

    setIsCancelling(true);
    try {
      const updatedSettlement = await cancelSettlement(settlement.id);
      setSettlement(updatedSettlement);
      toast.success(t('cancelSuccess'));
      setShowCancelDialog(false);
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        const apiError = err as { message?: string; errors?: Record<string, string[]> };
        if (apiError.errors) {
          const firstError = Object.values(apiError.errors)[0]?.[0];
          toast.error(firstError || apiError.message || t('cancelFailed'));
        } else if (apiError.message) {
          toast.error(apiError.message);
        } else {
          toast.error(t('cancelFailed'));
        }
      } else {
        toast.error(t('cancelFailed'));
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle2;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-500',
        };
      case 'cancelled':
        return {
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
          bg: 'from-red-500/20 via-red-500/10 to-transparent',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-500',
        };
      default:
        return {
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          bg: 'from-amber-500/20 via-amber-500/10 to-transparent',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-500',
        };
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'payout'
      ? {
          badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          text: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-500/10',
          icon: 'text-purple-500',
        }
      : {
          badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
          text: 'text-cyan-600 dark:text-cyan-400',
          bg: 'bg-cyan-500/10',
          icon: 'text-cyan-500',
        };
  };

  const getSettlebleIcon = (type: string) => {
    const settlebleType = getSettlementSettlebleType(type);
    return settlebleType === 'user' ? User : Building2;
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
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{error || t('errorLoading')}</p>
            <Button variant="outline" className="mt-6 rounded-xl" asChild>
              <Link href="/dashboard/finance/settlements">
                <ArrowLeft className="h-4 w-4 me-2" />
                {t('backToSettlements')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(settlement.status);
  const statusColors = getStatusColor(settlement.status);
  const typeColors = getTypeColor(settlement.type);
  const SettlebleIcon = getSettlebleIcon(settlement.settleble_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/dashboard/finance/settlements">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t('settlementDetails')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {settlement.settlement_number}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {settlement.status === 'pending' && (
          <div className="flex gap-2">
            {canConfirmSettlement && settlement.can_confirm && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('confirm')}
              </Button>
            )}
            {canCancelSettlement && settlement.can_cancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50 rounded-xl"
              >
                <XCircle className="h-4 w-4" />
                {t('cancel')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settlement Card */}
        <Card className="md:col-span-2 overflow-hidden relative border-0 shadow-lg">
          {/* Background Gradient */}
          <div className={cn(
            "absolute inset-0 bg-linear-to-br opacity-50",
            statusColors.bg
          )} />

          {/* Decorative Elements */}
          <div className="absolute top-0 end-0 w-64 h-64 bg-linear-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 start-0 w-48 h-48 bg-linear-to-tr from-primary/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center",
                  typeColors.bg
                )}>
                  {settlement.type === 'payout' ? (
                    <ArrowUpRight className={cn("h-6 w-6", typeColors.icon)} />
                  ) : (
                    <ArrowDownLeft className={cn("h-6 w-6", typeColors.icon)} />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{t('settlementAmount')}</CardTitle>
                  <CardDescription>{settlement.type_label}</CardDescription>
                </div>
              </div>
              <Badge className={cn("border", statusColors.badge)}>
                <StatusIcon className="h-3 w-3 me-1" />
                {settlement.status_label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Amount Display */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl md:text-6xl font-bold tracking-tight", typeColors.text)}>
                  {formatCurrency(settlement.amount)}
                </span>
                <span className="text-2xl font-medium text-muted-foreground">{tCommon('egp')}</span>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{t('period')}</span>
                </div>
                <p className="text-sm font-semibold">
                  {formatDate(settlement.period_from)}
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(settlement.period_to)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-background/60 backdrop-blur-sm border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{t('transactionsCount')}</span>
                </div>
                <p className="text-2xl font-bold">{settlement.items?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t('transactionsIncluded')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Info Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute top-0 end-0 w-32 h-32 bg-linear-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('settlementInfo')}</CardTitle>
                <CardDescription>{t('quickOverview')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Settlement Number */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('settlementNumber')}</p>
              <p className="text-sm font-mono font-semibold">{settlement.settlement_number}</p>
            </div>

            {/* Settleble */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('settleble')}</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  getSettlementSettlebleType(settlement.settleble_type) === 'user' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                )}>
                  <SettlebleIcon className={cn(
                    "h-4 w-4",
                    getSettlementSettlebleType(settlement.settleble_type) === 'user' ? 'text-blue-500' : 'text-purple-500'
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{getSettlementSettlebleName(settlement, locale)}</span>
                  {getSettlementSettlebleRole(settlement, locale) && (
                    <span className="text-xs text-muted-foreground">
                      {getSettlementSettlebleRole(settlement, locale)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Created At */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('createdAt')}</p>
              <p className="text-sm font-medium">{formatDateTime(settlement.created_at)}</p>
              {settlement.created_by && (
                <p className="text-xs text-muted-foreground">
                  {t('by')} {locale === 'ar' ? settlement.created_by.name_ar : settlement.created_by.name_en}
                </p>
              )}
            </div>

            {/* Confirmed At */}
            {settlement.status === 'confirmed' && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('confirmedAt')}</p>
                <p className="text-sm font-medium">{formatDateTime(settlement.confirmed_at)}</p>
                {settlement.confirmed_by && (
                  <p className="text-xs text-muted-foreground">
                    {t('by')} {locale === 'ar' ? settlement.confirmed_by.name_ar : settlement.confirmed_by.name_en}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {settlement.notes && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('notes')}</p>
                <p className="text-sm">{settlement.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settlement Items / Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t('includedTransactions')}</CardTitle>
              <CardDescription>{t('transactionsInSettlement')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!settlement.items || settlement.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t('noTransactionsInSettlement')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlement.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      item.transaction?.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {item.transaction?.type === 'credit' ? (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.transaction?.category_label || t('transaction')}</p>
                        {item.transaction && (
                          <Badge variant="outline" className="text-[10px]">
                            {item.transaction.type_label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        {item.transaction && (
                          <span className="font-mono">#{item.transaction.reference_number}</span>
                        )}
                        {item.order && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {item.order.order_number}
                          </span>
                        )}
                      </div>
                      {item.transaction?.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {item.transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-end sm:text-end">
                    <p className={cn(
                      "font-semibold",
                      item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)} {tCommon('egp')}
                    </p>
                    {item.transaction && (
                      <p className="text-xs text-muted-foreground">
                        {t('balanceAfter')}: {formatCurrency(item.transaction.balance_after)} {tCommon('egp')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Status Warning */}
      {settlement.status === 'pending' && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">{t('pendingSettlement')}</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('pendingSettlementInfo')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              {t('confirmSettlement')}
            </DialogTitle>
            <DialogDescription>
              {t('confirmSettlementDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('settlementNumber')}</span>
              <span className="font-mono font-medium">{settlement.settlement_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('amount')}</span>
              <span className="font-bold">{formatCurrency(settlement.amount)} {tCommon('egp')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('type')}</span>
              <Badge className={typeColors.badge}>{settlement.type_label}</Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isConfirming}
              className="rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('confirming')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t('confirmAction')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              {t('cancelSettlement')}
            </DialogTitle>
            <DialogDescription>
              {t('cancelSettlementDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('settlementNumber')}</span>
              <span className="font-mono font-medium">{settlement.settlement_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('amount')}</span>
              <span className="font-bold">{formatCurrency(settlement.amount)} {tCommon('egp')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('type')}</span>
              <Badge className={typeColors.badge}>{settlement.type_label}</Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('cancelWarning')}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
              className="rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
              className="gap-2 rounded-xl"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('cancelling')}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {t('cancelAction')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
