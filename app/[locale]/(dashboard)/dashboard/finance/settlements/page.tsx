"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Loader2,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import {
  fetchSettlements,
  confirmSettlement,
  cancelSettlement,
  getSettlementSettlebleName,
  getSettlementSettlebleType,
  getSettlementSettlebleRole,
  type Settlement,
  type SettlementFilters,
} from "@/lib/services/wallet";
import { PAGINATION } from "@/lib/constants/pagination";
import { cn } from "@/lib/utils";

export default function SettlementsPage() {
  const t = useTranslations('adminSettlements');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Check if user has permission to access settlements page
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_SETTLEMENTS] });

  // Permission checks
  const { hasPermission: canShowSettlement } = useHasPermission(PERMISSIONS.SHOW_SETTLEMENT);
  const { hasPermission: canConfirmSettlement } = useHasPermission(PERMISSIONS.CONFIRM_SETTLEMENT);
  const { hasPermission: canCancelSettlement } = useHasPermission(PERMISSIONS.CANCEL_SETTLEMENT);

  const queryClient = useQueryClient();

  // Pagination and filters state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    type: true,
    status: true,
    settleble: false,
    id: false,
  });

  // Action states
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  // Build API filters
  const apiFilters: SettlementFilters = useMemo(() => {
    const f: SettlementFilters = {
      page: currentPage,
      per_page: PAGINATION.SETTLEMENTS,
    };
    if (filters.id) f.id = parseInt(filters.id);
    if (filters.type) f.type = filters.type as 'payout' | 'collection';
    if (filters.status) f.status = filters.status as 'pending' | 'confirmed' | 'cancelled';
    if (filters.settleble_type) f.settleble_type = filters.settleble_type;
    if (filters.settleble_id) f.settleble_id = parseInt(filters.settleble_id);
    return f;
  }, [currentPage, filters]);

  // Fetch settlements with React Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settlements', apiFilters],
    queryFn: () => fetchSettlements(apiFilters, ['settleble', 'createdBy']),
    enabled: hasPermission === true,
  });

  const settlements = data?.data || [];
  const totalPages = data?.meta.last_page || 1;
  const totalCount = data?.meta.total || 0;

  // Filter settlements based on search query (client-side)
  const filteredSettlements = useMemo(() => {
    if (!searchQuery.trim()) return settlements;

    const searchLower = searchQuery.toLowerCase();
    return settlements.filter((settlement) => {
      const settlementNumber = (settlement.settlement_number || '').toLowerCase();
      const settlebleName = getSettlementSettlebleName(settlement, locale).toLowerCase();
      const notes = (settlement.notes || '').toLowerCase();

      return (
        settlementNumber.includes(searchLower) ||
        settlebleName.includes(searchLower) ||
        notes.includes(searchLower)
      );
    });
  }, [settlements, searchQuery, locale]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters((prev) => {
      if (!value) {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
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
    const pending = settlements.filter(s => s.status === 'pending');
    const confirmed = settlements.filter(s => s.status === 'confirmed');
    const payouts = settlements.filter(s => s.type === 'payout');
    const collections = settlements.filter(s => s.type === 'collection');
    const totalPayout = payouts.reduce((sum, s) => sum + s.amount, 0);
    const totalCollection = collections.reduce((sum, s) => sum + s.amount, 0);
    return {
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      totalPayout,
      totalCollection,
      total: totalCount,
    };
  }, [settlements, totalCount]);

  // Confirm settlement handler
  const handleConfirm = async () => {
    if (!selectedSettlement) return;

    setConfirmingId(selectedSettlement.id);
    try {
      await confirmSettlement(selectedSettlement.id);
      toast.success(t('confirmSuccess'));
      setShowConfirmDialog(false);
      setSelectedSettlement(null);
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
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
      setConfirmingId(null);
    }
  };

  // Cancel settlement handler
  const handleCancel = async () => {
    if (!selectedSettlement) return;

    setCancellingId(selectedSettlement.id);
    try {
      await cancelSettlement(selectedSettlement.id);
      toast.success(t('cancelSuccess'));
      setShowCancelDialog(false);
      setSelectedSettlement(null);
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
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
      setCancellingId(null);
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
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'short',
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
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'payout'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats - Modern Glass Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-500 border-0 bg-linear-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalSettlements')}</p>
                <p className="text-3xl font-bold mt-1 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                  {isLoading ? '-' : totalCount}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <FileText className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-500 border-0 bg-linear-to-br from-background via-background to-amber-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('pending')}</p>
                <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {isLoading ? '-' : stats.pendingCount}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-500 border-0 bg-linear-to-br from-background via-background to-purple-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalPayouts')}</p>
                <p className="text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {isLoading ? '-' : formatCurrency(stats.totalPayout)}
                </p>
                <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ArrowUpRight className="h-7 w-7 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-500 border-0 bg-linear-to-br from-background via-background to-cyan-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalCollections')}</p>
                <p className="text-3xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">
                  {isLoading ? '-' : formatCurrency(stats.totalCollection)}
                </p>
                <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ArrowDownLeft className="h-7 w-7 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Filters */}
      <Card className="border-0 shadow-sm bg-linear-to-br from-background to-muted/20">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-11 pe-10 h-12 bg-background/50 border-border/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg"
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
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{t('filters')}</h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ms-2 rounded-full px-2.5">
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
                  className="gap-2 rounded-lg"
                >
                  <X className="h-4 w-4" />
                  {tCommon('clearAll')}
                </Button>
              )}
            </div>

            {/* Filter Sections */}
            {isFiltersExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Settlement ID */}
                <div className="border rounded-xl p-4 bg-background/50">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, id: !prev.id }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('settlementId')}</Label>
                      {filters.id && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs rounded-full">1</Badge>
                      )}
                    </div>
                    {expandedSections.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.id && (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={filters.id || ""}
                        onChange={(e) => handleFilterChange("id", e.target.value)}
                        placeholder={t('enterSettlementId')}
                        className="h-10 bg-background rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Settlement Type */}
                <div className="border rounded-xl p-4 bg-background/50">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, type: !prev.type }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('settlementType')}</Label>
                      {filters.type && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs rounded-full">1</Badge>
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
                      <Select
                        value={filters.type || "all"}
                        onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="h-10 bg-background rounded-lg">
                          <SelectValue placeholder={t('allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allTypes')}</SelectItem>
                          <SelectItem value="payout">{t('payout')}</SelectItem>
                          <SelectItem value="collection">{t('collection')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Settlement Status */}
                <div className="border rounded-xl p-4 bg-background/50">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, status: !prev.status }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('settlementStatus')}</Label>
                      {filters.status && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs rounded-full">1</Badge>
                      )}
                    </div>
                    {expandedSections.status ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.status && (
                    <div className="space-y-2">
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="h-10 bg-background rounded-lg">
                          <SelectValue placeholder={t('allStatuses')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allStatuses')}</SelectItem>
                          <SelectItem value="pending">{t('pending')}</SelectItem>
                          <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                          <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Settleble (Owner) */}
                <div className="border rounded-xl p-4 bg-background/50">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, settleble: !prev.settleble }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t('settlebleFilter')}</Label>
                      {(filters.settleble_type || filters.settleble_id) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs rounded-full">
                          {(filters.settleble_type ? 1 : 0) + (filters.settleble_id ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.settleble ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.settleble && (
                    <div className="space-y-3">
                      <Select
                        value={filters.settleble_type || "all"}
                        onValueChange={(value) => handleFilterChange("settleble_type", value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="h-10 bg-background rounded-lg">
                          <SelectValue placeholder={t('settlebleType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allSettlebleTypes')}</SelectItem>
                          <SelectItem value="Src\\Domain\\User\\Entities\\User">{t('user')}</SelectItem>
                          <SelectItem value="Src\\Domain\\Vendor\\Entities\\Vendor">{t('vendor')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={filters.settleble_id || ""}
                        onChange={(e) => handleFilterChange("settleble_id", e.target.value)}
                        placeholder={t('settlebleId')}
                        className="h-10 bg-background rounded-lg"
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
      {!isLoading && filteredSettlements.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {t('showing')} <span className="font-medium text-foreground">{filteredSettlements.length}</span> {t('of')} <span className="font-medium text-foreground">{totalCount}</span> {t('settlementsLabel')}
            {totalPages > 1 && ` (${t('page')} ${currentPage} ${t('of')} ${totalPages})`}
          </p>
        </div>
      )}

      {/* Settlements List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">{t('loadingSettlements')}</p>
        </div>
      ) : filteredSettlements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">{t('noSettlements')}</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {searchQuery || Object.values(filters).some(v => v)
                ? t('noSettlementsMatch')
                : t('noSettlementsDesc')}
            </p>
            {(searchQuery || Object.values(filters).some(v => v)) && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2 mt-6 rounded-xl"
              >
                <X className="h-4 w-4" />
                {tCommon('clearAll')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSettlements.map((settlement) => {
            const StatusIcon = getStatusIcon(settlement.status);
            const SettlebleIcon = getSettlebleIcon(settlement.settleble_type);

            return (
              <Card
                key={settlement.id}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-linear-to-br from-background to-muted/10"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Settlement Info */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start gap-4">
                        {/* Type Icon */}
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                          settlement.type === 'payout' ? 'bg-purple-500/10' : 'bg-cyan-500/10'
                        )}>
                          {settlement.type === 'payout' ? (
                            <ArrowUpRight className="h-6 w-6 text-purple-500" />
                          ) : (
                            <ArrowDownLeft className="h-6 w-6 text-cyan-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-foreground">
                              {settlement.settlement_number}
                            </h3>
                            <Badge className={cn("text-[10px] border", getStatusColor(settlement.status))}>
                              <StatusIcon className="h-3 w-3 me-1" />
                              {settlement.status_label}
                            </Badge>
                            <Badge className={cn("text-[10px]", getTypeColor(settlement.type))}>
                              {settlement.type_label}
                            </Badge>
                          </div>

                          {/* Info Row */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <SettlebleIcon className="h-3.5 w-3.5" />
                              <span>{getSettlementSettlebleName(settlement, locale)}</span>
                              {getSettlementSettlebleRole(settlement, locale) && (
                                <Badge variant="outline" className="text-[10px] ms-1 h-5 px-1.5 font-normal">
                                  {getSettlementSettlebleRole(settlement, locale)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(settlement.period_from)} - {formatDate(settlement.period_to)}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {settlement.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                              {settlement.notes}
                            </p>
                          )}

                          {/* Created Info */}
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('createdAt')}: {formatDateTime(settlement.created_at)}
                            {settlement.created_by && (
                              <span className="ms-2">
                                {t('by')} {locale === 'ar' ? settlement.created_by.name_ar : settlement.created_by.name_en}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Amount & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 p-5 border-t lg:border-t-0 lg:border-s border-border/40 bg-muted/10 lg:min-w-[260px]">
                      <div className="text-end">
                        <p className={cn(
                          "text-2xl font-bold",
                          settlement.type === 'payout' ? 'text-purple-600 dark:text-purple-400' : 'text-cyan-600 dark:text-cyan-400'
                        )}>
                          {formatCurrency(settlement.amount)} {tCommon('egp')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {settlement.items?.length || 0} {t('transactionsIncluded')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {settlement.status === 'pending' && (
                          <>
                            {canConfirmSettlement && settlement.can_confirm && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowConfirmDialog(true);
                                }}
                                disabled={confirmingId === settlement.id}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              >
                                {confirmingId === settlement.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {t('confirm')}
                              </Button>
                            )}
                            {canCancelSettlement && settlement.can_cancel && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowCancelDialog(true);
                                }}
                                disabled={cancellingId === settlement.id}
                                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50 rounded-lg"
                              >
                                {cancellingId === settlement.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                {t('cancel')}
                              </Button>
                            )}
                          </>
                        )}
                        {canShowSettlement && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="gap-1.5 rounded-lg"
                          >
                            <Link href={`/dashboard/finance/settlements/${settlement.id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t('viewDetails')}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="rounded-lg"
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
                      className="w-9 h-9 p-0 rounded-lg"
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
                className="rounded-lg"
              >
                {t('next')}
              </Button>
            </div>
          )}
        </div>
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

          {selectedSettlement && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settlementNumber')}</span>
                <span className="font-mono font-medium">{selectedSettlement.settlement_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('amount')}</span>
                <span className="font-bold">{formatCurrency(selectedSettlement.amount)} {tCommon('egp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('type')}</span>
                <Badge className={getTypeColor(selectedSettlement.type)}>{selectedSettlement.type_label}</Badge>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={confirmingId !== null}
              className="rounded-lg"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirmingId !== null}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              {confirmingId !== null ? (
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

          {selectedSettlement && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settlementNumber')}</span>
                <span className="font-mono font-medium">{selectedSettlement.settlement_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('amount')}</span>
                <span className="font-bold">{formatCurrency(selectedSettlement.amount)} {tCommon('egp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('type')}</span>
                <Badge className={getTypeColor(selectedSettlement.type)}>{selectedSettlement.type_label}</Badge>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('cancelWarning')}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingId !== null}
              className="rounded-lg"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancellingId !== null}
              className="gap-2 rounded-lg"
            >
              {cancellingId !== null ? (
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
