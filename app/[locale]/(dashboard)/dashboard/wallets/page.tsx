"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Loader2,
  ArrowUpRight,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchWallets, getWalletOwnerType, getWalletOwnerName, type Wallet as WalletType } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

export default function WalletsPage() {
  const t = useTranslations('adminWallets');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  // Check if user has permission to access wallets page
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_WALLETS] });

  // Permission check for viewing wallet details
  const { hasPermission: canShowWallet } = useHasPermission(PERMISSIONS.SHOW_WALLET);

  // Wallets state
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ownerType: true,
    balanceStatus: false,
  });

  // Load wallets on mount
  const hasLoadedWalletsRef = useRef(false);
  useEffect(() => {
    if (hasLoadedWalletsRef.current) return;

    const loadWallets = async () => {
      hasLoadedWalletsRef.current = true;
      setIsLoadingWallets(true);
      try {
        const response = await fetchWallets({ per_page: 100, includes: ['walletable'] });
        setWallets(response.data);
      } catch {
        toast.error(t('errorLoadingWallets'));
      } finally {
        setIsLoadingWallets(false);
      }
    };

    loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter wallets based on search query and filters
  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      // Search query (searches owner name, id)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const ownerName = getWalletOwnerName(wallet, locale).toLowerCase();
        const walletId = wallet.id.toString();

        if (!ownerName.includes(searchLower) && !walletId.includes(searchLower)) {
          return false;
        }
      }

      // Owner type filter
      if (filters.owner_type) {
        const ownerType = getWalletOwnerType(wallet.walletable_type);
        if (ownerType !== filters.owner_type) {
          return false;
        }
      }

      // Balance status filter
      if (filters.balance_status) {
        if (wallet.balance_status !== filters.balance_status) {
          return false;
        }
      }

      return true;
    });
  }, [wallets, filters, searchQuery, locale]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  // Stats calculations
  const stats = useMemo(() => {
    const positive = filteredWallets.filter(w => w.balance_status === 'positive').length;
    const negative = filteredWallets.filter(w => w.balance_status === 'negative').length;
    const zero = filteredWallets.filter(w => w.balance_status === 'zero').length;
    const totalBalance = filteredWallets.reduce((sum, w) => sum + w.balance, 0);
    return { positive, negative, zero, totalBalance };
  }, [filteredWallets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getBalanceStatusConfig = (status: string) => {
    if (status === 'negative') {
      return {
        bgGradient: 'from-red-500/10 to-transparent',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-500',
        icon: AlertTriangle,
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
    } else if (status === 'positive') {
      return {
        bgGradient: 'from-emerald-500/10 to-transparent',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-500',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
    }
    return {
      bgGradient: 'from-slate-500/10 to-transparent',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-500',
      icon: MinusCircle,
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
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
                <p className="text-sm text-muted-foreground">{t('totalWallets')}</p>
                <p className="text-2xl font-bold">{isLoadingWallets ? '-' : filteredWallets.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('positiveBalance')}</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {isLoadingWallets ? '-' : stats.positive}
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
                <p className="text-sm text-muted-foreground">{t('negativeBalance')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {isLoadingWallets ? '-' : stats.negative}
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
                <p className="text-sm text-muted-foreground">{t('totalBalance')}</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.totalBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {isLoadingWallets ? '-' : `${stats.totalBalance < 0 ? '-' : ''}${formatCurrency(stats.totalBalance)}`}
                </p>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                stats.totalBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                <CircleDollarSign className={cn(
                  "h-6 w-6",
                  stats.totalBalance >= 0 ? "text-emerald-500" : "text-red-500"
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
                placeholder={t('searchWallets')}
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
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
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
              </button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {tCommon('clearAll')}
                </Button>
              )}
            </div>

            {/* Filter Sections */}
            {isFiltersExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Owner Type */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, ownerType: !prev.ownerType }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('ownerType')}</Label>
                      {filters.owner_type && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.ownerType ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.ownerType && (
                    <div className="space-y-2">
                      <Label htmlFor="owner-type-filter" className="text-xs text-muted-foreground font-medium">
                        {t('selectOwnerType')}
                      </Label>
                      <Select
                        value={filters.owner_type || undefined}
                        onValueChange={(value) => handleFilterChange("owner_type", value)}
                      >
                        <SelectTrigger id="owner-type-filter" className="h-10 bg-background">
                          <SelectValue placeholder={t('allOwnerTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{t('userWallets')}</SelectItem>
                          <SelectItem value="vendor">{t('vendorWallets')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Balance Status */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, balanceStatus: !prev.balanceStatus }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('balanceStatus')}</Label>
                      {filters.balance_status && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.balanceStatus ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.balanceStatus && (
                    <div className="space-y-2">
                      <Label htmlFor="balance-status-filter" className="text-xs text-muted-foreground font-medium">
                        {t('selectBalanceStatus')}
                      </Label>
                      <Select
                        value={filters.balance_status || undefined}
                        onValueChange={(value) => handleFilterChange("balance_status", value)}
                      >
                        <SelectTrigger id="balance-status-filter" className="h-10 bg-background">
                          <SelectValue placeholder={t('allStatuses')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">{t('positiveBalance')}</SelectItem>
                          <SelectItem value="negative">{t('negativeBalance')}</SelectItem>
                          <SelectItem value="zero">{t('zeroBalance')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {!isLoadingWallets && filteredWallets.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredWallets.length === wallets.length
              ? `${filteredWallets.length} ${filteredWallets.length === 1 ? t('wallet') : t('walletPlural')}`
              : `${t('showing')} ${filteredWallets.length} ${t('of')} ${wallets.length} ${t('walletPlural')}`}
          </p>
        </div>
      )}

      {/* Wallets Grid */}
      {isLoadingWallets ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredWallets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noWallets')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || Object.values(filters).some(v => v)
                ? t('noWalletsMatch')
                : t('noWalletsDesc')}
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWallets.map((wallet) => {
            const statusConfig = getBalanceStatusConfig(wallet.balance_status);
            const ownerType = getWalletOwnerType(wallet.walletable_type);
            const OwnerIcon = getOwnerTypeIcon(ownerType);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={wallet.id}
                onClick={() => canShowWallet && router.push(`/dashboard/wallets/${wallet.id}`)}
                className={cn(
                  "group relative",
                  canShowWallet ? "cursor-pointer" : "cursor-default"
                )}
              >
                {/* Card Container with glassmorphism */}
                <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">
                  {/* Background Gradient */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-50",
                    statusConfig.bgGradient
                  )} />

                  {/* Gradient Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Section - Owner & Status */}
                  <div className="relative p-5 pb-4">
                    <div className="flex items-start justify-between">
                      {/* Owner Info */}
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "h-14 w-14 rounded-xl overflow-hidden ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center",
                            ownerType === 'user' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                          )}>
                            <OwnerIcon className={cn(
                              "h-6 w-6",
                              ownerType === 'user' ? 'text-blue-500' : 'text-purple-500'
                            )} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                            {getWalletOwnerName(wallet, locale)}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Owner Type Badge */}
                            <div className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                              ownerType === 'user'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                            )}>
                              {ownerType === 'user' ? t('user') : t('vendor')}
                            </div>
                            {/* Role Badge for Users */}
                            {ownerType === 'user' && wallet.walletable?.roles && wallet.walletable.roles.length > 0 && (
                              <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Shield className="h-2.5 w-2.5" />
                                {locale === 'ar' ? wallet.walletable.roles[0].slug_ar : wallet.walletable.roles[0].slug_en}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">#{wallet.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge className={cn("flex-shrink-0", statusConfig.badgeClass)}>
                        <StatusIcon className="h-3 w-3 me-1" />
                        {wallet.balance_status === 'positive' && t('positive')}
                        {wallet.balance_status === 'negative' && t('negative')}
                        {wallet.balance_status === 'zero' && t('zero')}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    {wallet.walletable && (wallet.walletable.email || wallet.walletable.mobile) && (
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                        {wallet.walletable.mobile && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate" dir="ltr">{wallet.walletable.mobile}</span>
                          </div>
                        )}
                        {wallet.walletable.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{wallet.walletable.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Balance Display */}
                  <div className="relative px-5 pb-4">
                    <div className="p-4 rounded-xl bg-background/60 backdrop-blur-sm border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('currentBalance')}</p>
                      <div className="flex items-baseline gap-2">
                        {wallet.balance < 0 && (
                          <span className="text-xl font-bold text-red-500">-</span>
                        )}
                        <span className={cn(
                          "text-3xl font-bold tracking-tight",
                          wallet.balance < 0 ? "text-red-600 dark:text-red-400" :
                            wallet.balance > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}>
                          {formatCurrency(wallet.balance)}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{tCommon('egp')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credit/Debit Stats */}
                  <div className="relative px-5 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">{t('credited')}</p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(wallet.total_credited)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">{t('debited')}</p>
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            -{formatCurrency(wallet.total_debited)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="relative px-5 pb-4 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground/60 font-medium">
                        {canShowWallet ? t('viewDetails') : t('viewOnly')}
                      </span>
                      {canShowWallet && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                          <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
