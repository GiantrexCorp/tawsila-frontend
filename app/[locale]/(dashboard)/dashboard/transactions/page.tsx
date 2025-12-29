"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Search,
  Hash,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { fetchMyTransactions, type TransactionFilters } from "@/lib/services/wallet";
import { PAGINATION } from "@/lib/constants/pagination";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export default function TransactionsPage() {
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Build API filters
  const apiFilters: TransactionFilters = useMemo(() => ({
    page: currentPage,
    per_page: PAGINATION.TRANSACTIONS,
    type: typeFilter !== 'all' ? typeFilter as 'credit' | 'debit' : undefined,
  }), [currentPage, typeFilter]);

  // Fetch transactions with React Query
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['my-transactions', apiFilters],
    queryFn: () => fetchMyTransactions(apiFilters),
  });

  const transactions = data?.data || [];
  const totalPages = data?.meta.last_page || 1;
  const totalCount = data?.meta.total || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.reference_number.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      tx.order?.order_number?.toLowerCase().includes(query) ||
      tx.category_label.toLowerCase().includes(query)
    );
  });

  // Calculate summary stats
  const totalCredits = transactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebits = transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 me-2" />
              {tCommon('tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4 me-2", isFetching && "animate-spin")} />
            {t('refresh')}
          </Button>
          <Link href="/dashboard/wallet">
            <Button variant="default" size="sm">
              {t('viewWallet')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Transactions */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalTransactions')}</p>
                <p className="text-2xl font-bold mt-1">{totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('transactionsRecorded')}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Credits */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('pageCredits')}</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCurrency(totalCredits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Debits */}
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('pageDebits')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  -{formatCurrency(totalDebits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tCommon('egp')}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="credit">{t('creditsOnly')}</SelectItem>
                <SelectItem value="debit">{t('debitsOnly')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(typeFilter !== 'all' || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 me-2" />
                {tCommon('clearAll')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('recentTransactions')}</CardTitle>
              <CardDescription>
                {t('showingTransactions', { count: filteredTransactions.length, total: totalCount })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('noTransactions')}</h3>
              <p className="text-muted-foreground">{t('noTransactionsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200"
                >
                  {/* Transaction Icon */}
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                    transaction.type === 'credit'
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  )}>
                    {transaction.type === 'credit' ? (
                      <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{transaction.category_label}</h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              transaction.type === 'credit'
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                            )}
                          >
                            {transaction.type_label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {transaction.description}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-end flex-shrink-0">
                        <p className={cn(
                          "text-lg font-bold",
                          transaction.type === 'credit'
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono">{transaction.reference_number}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(transaction.created_at)}</span>
                      </div>

                      {transaction.order && (
                        <Link
                          href={`/dashboard/orders/${transaction.order.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Package className="h-3 w-3" />
                          <span>{transaction.order.order_number}</span>
                        </Link>
                      )}

                      {transaction.created_by && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {locale === 'ar' ? transaction.created_by.name_ar : transaction.created_by.name_en}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Balance After */}
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t('balanceAfter')}</span>
                        <span className={cn(
                          "font-semibold",
                          transaction.balance_after >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {transaction.balance_after >= 0 ? '' : '-'}{formatCurrency(transaction.balance_after)} {tCommon('egp')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
