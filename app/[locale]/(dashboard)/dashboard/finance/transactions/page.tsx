"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Loader2,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  Calendar,
  Hash,
  Wallet,
  Tag,
  ExternalLink,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchTransactions,
  TRANSACTION_CATEGORIES,
  type TransactionFilters,
} from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

export default function AdminTransactionsPage() {
  const searchParams = useSearchParams();
  const initialWalletId = searchParams.get('wallet_id');

  const t = useTranslations('adminTransactions');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  // Check if user has permission to access transactions page
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_TRANSACTIONS] });

  // Permission check for viewing details
  const { hasPermission: canShowWallet } = useHasPermission(PERMISSIONS.SHOW_WALLET);
  const { hasPermission: canShowTransaction } = useHasPermission(PERMISSIONS.SHOW_TRANSACTION);

  // Pagination and filters state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (initialWalletId) {
      initial.wallet_id = initialWalletId;
    }
    return initial;
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    type: true,
    category: false,
    date: false,
    wallet: !!initialWalletId,
  });

  // Build API filters
  const apiFilters: TransactionFilters = useMemo(() => {
    const f: TransactionFilters = {
      page: currentPage,
      per_page: 20,
    };
    if (filters.type) f.type = filters.type as 'credit' | 'debit';
    if (filters.category) f.category = filters.category;
    if (filters.from_date) f.from_date = filters.from_date;
    if (filters.to_date) f.to_date = filters.to_date;
    if (filters.wallet_id) f.wallet_id = parseInt(filters.wallet_id);
    return f;
  }, [currentPage, filters]);

  // Fetch transactions with React Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', apiFilters],
    queryFn: () => fetchTransactions(apiFilters),
    enabled: hasPermission === true,
  });

  const transactions = data?.data || [];
  const totalPages = data?.meta.last_page || 1;
  const totalCount = data?.meta.total || 0;

  // Filter transactions based on search query (client-side)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const searchLower = searchQuery.toLowerCase();
    return transactions.filter((transaction) => {
      const refNumber = (transaction.reference_number || '').toLowerCase();
      const category = (transaction.category_label || '').toLowerCase();
      const description = (transaction.description || '').toLowerCase();
      const orderNumber = (transaction.order?.order_number || '').toLowerCase();

      return (
        refNumber.includes(searchLower) ||
        category.includes(searchLower) ||
        description.includes(searchLower) ||
        orderNumber.includes(searchLower)
      );
    });
  }, [transactions, searchQuery]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters({});
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  // Stats calculations
  const stats = useMemo(() => {
    const credits = filteredTransactions.filter(t => t.type === 'credit');
    const debits = filteredTransactions.filter(t => t.type === 'debit');
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    return {
      creditCount: credits.length,
      debitCount: debits.length,
      totalCredits,
      totalDebits,
      net: totalCredits - totalDebits,
    };
  }, [filteredTransactions]);

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

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalTransactions')}</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : totalCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalCredits')}</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {isLoading ? '-' : `+${formatCurrency(stats.totalCredits)}`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalDebits')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {isLoading ? '-' : `-${formatCurrency(stats.totalDebits)}`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('netAmount')}</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {isLoading ? '-' : `${stats.net >= 0 ? '+' : '-'}${formatCurrency(stats.net)}`}
                </p>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                stats.net >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                <CircleDollarSign className={cn(
                  "h-6 w-6",
                  stats.net >= 0 ? "text-emerald-500" : "text-red-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchTransactions')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Header */}
            <div 
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">{t('filters')}</h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ms-2">
                    {activeFiltersCount}
                  </Badge>
                )}
                {isFiltersExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground ms-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ms-2" />
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFilters();
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {tCommon('clearAll')}
                </Button>
              )}
            </div>

            {/* Filter Sections */}
            {isFiltersExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transaction Type */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, type: !prev.type }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('transactionType')}</Label>
                      {filters.type && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.type ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.type && (
                    <div className="space-y-2">
                      <Label htmlFor="type-filter" className="text-xs text-muted-foreground font-medium">
                        {t('selectType')}
                      </Label>
                      <Select
                        value={filters.type || undefined}
                        onValueChange={(value) => handleFilterChange("type", value)}
                      >
                        <SelectTrigger id="type-filter" className="h-10 bg-background">
                          <SelectValue placeholder={t('allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">{t('credit')}</SelectItem>
                          <SelectItem value="debit">{t('debit')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, category: !prev.category }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('category')}</Label>
                      {filters.category && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.category ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.category && (
                    <div className="space-y-2">
                      <Label htmlFor="category-filter" className="text-xs text-muted-foreground font-medium">
                        {t('selectCategory')}
                      </Label>
                      <Select
                        value={filters.category || undefined}
                        onValueChange={(value) => handleFilterChange("category", value)}
                      >
                        <SelectTrigger id="category-filter" className="h-10 bg-background">
                          <SelectValue placeholder={t('allCategories')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TRANSACTION_CATEGORIES.SHIPPING_FEE}>{t('categoryShippingFee')}</SelectItem>
                          <SelectItem value={TRANSACTION_CATEGORIES.COD_COLLECTION}>{t('categoryCodCollection')}</SelectItem>
                          <SelectItem value={TRANSACTION_CATEGORIES.ADJUSTMENT}>{t('categoryAdjustment')}</SelectItem>
                          <SelectItem value={TRANSACTION_CATEGORIES.SETTLEMENT}>{t('categorySettlement')}</SelectItem>
                          <SelectItem value={TRANSACTION_CATEGORIES.PREPAID_REVENUE}>{t('categoryPrepaidRevenue')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, date: !prev.date }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('dateRange')}</Label>
                      {(filters.from_date || filters.to_date) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                          {(filters.from_date ? 1 : 0) + (filters.to_date ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.date ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.date && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="from-date" className="text-xs text-muted-foreground font-medium">
                            {t('fromDate')}
                          </Label>
                          <Input
                            id="from-date"
                            type="date"
                            value={filters.from_date || ""}
                            onChange={(e) => handleFilterChange("from_date", e.target.value)}
                            className="h-10 bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="to-date" className="text-xs text-muted-foreground font-medium">
                            {t('toDate')}
                          </Label>
                          <Input
                            id="to-date"
                            type="date"
                            value={filters.to_date || ""}
                            onChange={(e) => handleFilterChange("to_date", e.target.value)}
                            className="h-10 bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Filter */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, wallet: !prev.wallet }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('walletFilter')}</Label>
                      {filters.wallet_id && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.wallet ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.wallet && (
                    <div className="space-y-2">
                      <Label htmlFor="wallet-id" className="text-xs text-muted-foreground font-medium">
                        {t('walletId')}
                      </Label>
                      <Input
                        id="wallet-id"
                        type="number"
                        value={filters.wallet_id || ""}
                        onChange={(e) => handleFilterChange("wallet_id", e.target.value)}
                        placeholder={t('enterWalletId')}
                        className="h-10 bg-background"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count & Pagination Info */}
      {!isLoading && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('showing')} {filteredTransactions.length} {t('of')} {totalCount} {t('transactionPlural')}
            {totalPages > 1 && ` (${t('page')} ${currentPage} ${t('of')} ${totalPages})`}
          </p>
        </div>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noTransactions')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || Object.values(filters).some(v => v)
                ? t('noTransactionsMatch')
                : t('noTransactionsDesc')}
            </p>
            {(searchQuery || Object.values(filters).some(v => v)) && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2 mt-4"
              >
                {tCommon('clearAll')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="group hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Left Side - Transaction Icon & Info */}
                  <div className="flex items-center gap-4 p-4 md:p-5 flex-1">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      transaction.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    )}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {transaction.category_label}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            transaction.type === 'credit'
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'border-red-500/30 text-red-600 dark:text-red-400'
                          )}
                        >
                          {transaction.type === 'credit' ? t('credit') : t('debit')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="font-mono">#{transaction.reference_number}</span>
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.order && (
                          <span className="flex items-center gap-1">
                            {t('order')}: {transaction.order.order_number}
                          </span>
                        )}
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 p-4 md:p-5 border-t md:border-t-0 md:border-l border-border/40 bg-muted/20 md:bg-transparent md:min-w-[280px]">
                    <div className="text-end">
                      <p className={cn(
                        "text-xl font-bold",
                        transaction.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)} {tCommon('egp')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('balanceAfter')}: {formatCurrency(transaction.balance_after)} {tCommon('egp')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canShowWallet && transaction.wallet_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/wallets/${transaction.wallet_id}`)}
                          className="h-8 px-3"
                        >
                          <Wallet className="h-4 w-4 me-1" />
                          {t('viewWallet')}
                        </Button>
                      )}
                      {canShowTransaction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/finance/transactions/${transaction.id}`)}
                          className="h-8 px-3"
                        >
                          <ExternalLink className="h-4 w-4 me-1" />
                          {t('details')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                {t('previous')}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
