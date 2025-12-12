"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warehouse, Plus, Loader2, MapPin, Phone, Edit, Trash2, ArrowUpRight, Search, X, Filter, ChevronDown, ChevronUp, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchInventories, deleteInventory, type Inventory } from "@/lib/services/inventories";
import { fetchGovernorates, fetchCities, type Governorate, type City } from "@/lib/services/vendors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewToggle, type ViewType } from "@/components/ui/view-toggle";
import { InventoryTable } from "@/components/inventory/inventory-table";

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  // Check if user has permission to access inventory page
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_INVENTORIES] });

  // Permission checks for actions
  const { hasPermission: canCreateInventory } = useHasPermission(PERMISSIONS.CREATE_INVENTORY);
  const { hasPermission: canUpdateInventory } = useHasPermission(PERMISSIONS.UPDATE_INVENTORY);

  // Inventories state
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inventoryInfo: true,
    location: false,
  });
  const [viewType, setViewType] = useState<ViewType>("cards");
  
  // Governorates and Cities for filters
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Load governorates on mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        const fetchedGovernorates = await fetchGovernorates();
        setGovernorates(fetchedGovernorates);
      } catch {
        toast.error(t('errorLoadingGovernorates'));
      }
    };
    loadGovernorates();
  }, [t]);


  // Load inventories on mount
  useEffect(() => {
    const loadInventories = async () => {
      setIsLoading(true);
      try {
        const fetchedInventories = await fetchInventories();
        setInventories(fetchedInventories);
      } catch {
        toast.error(t('errorLoadingInventories'));
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadInventories();
    }
  }, [hasPermission, t]);

  // Filter inventories based on search query and filters
  const filteredInventories = useMemo(() => {
    return inventories.filter((inventory) => {
      // Search query (searches name, code, address, phone)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameEn = (inventory.name_en || '').toLowerCase();
        const nameAr = (inventory.name_ar || '').toLowerCase();
        const name = (inventory.name || '').toLowerCase();
        const code = (inventory.code || '').toLowerCase();
        const address = (inventory.address || '').toLowerCase();
        const phone = (inventory.phone || '').toLowerCase();
        
        if (
          !nameEn.includes(searchLower) &&
          !nameAr.includes(searchLower) &&
          !name.includes(searchLower) &&
          !code.includes(searchLower) &&
          !address.includes(searchLower) &&
          !phone.includes(searchLower)
        ) {
          return false;
        }
      }

      // Name filter
      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        const nameEn = (inventory.name_en || '').toLowerCase();
        const nameAr = (inventory.name_ar || '').toLowerCase();
        const name = (inventory.name || '').toLowerCase();
        if (!nameEn.includes(searchLower) && !nameAr.includes(searchLower) && !name.includes(searchLower)) {
          return false;
        }
      }

      // Code filter
      if (filters.code) {
        const code = (inventory.code || '').toLowerCase();
        if (!code.includes(filters.code.toLowerCase())) {
          return false;
        }
      }

      // Governorate filter
      if (filters.governorate_id) {
        const governorateId = parseInt(filters.governorate_id);
        if (inventory.governorate_id !== governorateId && inventory.governorate?.id !== governorateId) {
          return false;
        }
      }

      // City filter
      if (filters.city_id) {
        const cityId = parseInt(filters.city_id);
        if (inventory.city_id !== cityId && inventory.city?.id !== cityId) {
          return false;
        }
      }

      return true;
    });
  }, [inventories, filters, searchQuery]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Clear city filter if governorate changes
      if (key === 'governorate_id') {
        if (value === '') {
          delete newFilters.city_id;
        } else {
          // Load cities for the selected governorate
          const governorateId = parseInt(value);
          fetchCities(governorateId)
            .then(setCities)
            .catch(() => toast.error(t('errorLoadingCities')));
        }
      }
      return newFilters;
    });
  }, [t]);

  const handleLocationFilterChange = useCallback((governorateId: string, cityId?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (governorateId) {
        newFilters.governorate_id = governorateId;
        if (cityId) {
          newFilters.city_id = cityId;
        } else {
          delete newFilters.city_id;
        }
        // Load cities for the selected governorate
        setIsLoadingCities(true);
        fetchCities(parseInt(governorateId))
          .then(setCities)
          .catch(() => toast.error(t('errorLoadingCities')))
          .finally(() => setIsLoadingCities(false));
      } else {
        delete newFilters.governorate_id;
        delete newFilters.city_id;
        setCities([]);
      }
      return newFilters;
    });
  }, [t]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  const handleDelete = async () => {
    if (!inventoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteInventory(inventoryToDelete.id);
      
      // Refresh the inventory list from the server to ensure we have the actual state
      // This will reveal if the backend didn't actually delete the inventory
      const fetchedInventories = await fetchInventories();
      setInventories(fetchedInventories);
      
      setInventoryToDelete(null);
      toast.success(t('inventoryDeletedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errorDeletingInventory');
      toast.error(t('deleteFailed'), { description: message });
    } finally {
      setIsDeleting(false);
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        {canCreateInventory && (
          <Button className="w-full sm:w-auto gap-2" onClick={() => router.push('/dashboard/inventory/new')}>
            <Plus className="h-4 w-4" />
            {t('createInventory')}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('totalInventories')}</p>
                <p className="text-3xl font-bold tracking-tight">
                  {isLoading ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    inventories.length
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('activeInventories')}</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
                  {isLoading ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    inventories.filter(inv => inv.status === 'active' || inv.is_active).length
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('inactiveInventories')}</p>
                <p className="text-3xl font-bold tracking-tight text-muted-foreground">
                  {isLoading ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    inventories.filter(inv => inv.status === 'inactive' && !inv.is_active).length
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-muted-foreground" />
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
                placeholder={t("searchInventories")}
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
                <h3 className="text-lg font-semibold">{t("filters")}</h3>
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
                  {tCommon("clearAll")}
                </Button>
              )}
            </div>

            {/* Filter Sections - Organized */}
            {isFiltersExpanded && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Inventory Information */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, inventoryInfo: !prev.inventoryInfo }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("inventoryInformation")}</Label>
                          {(filters.name || filters.code) && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                              {(filters.name ? 1 : 0) + (filters.code ? 1 : 0)}
                            </Badge>
                          )}
                        </div>
                        {expandedSections.inventoryInfo ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.inventoryInfo && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="name-filter" className="text-xs text-muted-foreground font-medium">
                              {t("name")}
                            </Label>
                            <Input
                              id="name-filter"
                              value={filters.name || ""}
                              onChange={(e) => handleFilterChange("name", e.target.value)}
                              placeholder={t("searchInventories")}
                              className="h-10 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="code-filter" className="text-xs text-muted-foreground font-medium">
                              {t("inventoryCode")}
                            </Label>
                            <Input
                              id="code-filter"
                              value={filters.code || ""}
                              onChange={(e) => handleFilterChange("code", e.target.value)}
                              placeholder={t("inventoryCode")}
                              className="h-10 bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Location */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, location: !prev.location }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("location")}</Label>
                          {(filters.governorate_id || filters.city_id) && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                              {(filters.governorate_id ? 1 : 0) + (filters.city_id ? 1 : 0)}
                            </Badge>
                          )}
                        </div>
                        {expandedSections.location ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.location && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="governorate-filter" className="text-xs text-muted-foreground font-normal">
                                {t("governorate")}
                              </Label>
                              <Select
                                value={filters.governorate_id || undefined}
                                onValueChange={(value) => handleLocationFilterChange(value)}
                              >
                                <SelectTrigger id="governorate-filter" className="h-10 bg-background">
                                  <SelectValue placeholder={t("selectGovernorate")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {governorates.map((gov) => (
                                    <SelectItem key={gov.id} value={gov.id.toString()}>
                                      {locale === "ar" ? gov.name_ar : gov.name_en}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city-filter" className="text-xs text-muted-foreground font-normal">
                                {t("city")}
                              </Label>
                              <Select
                                value={filters.city_id || undefined}
                                onValueChange={(value) => handleLocationFilterChange(filters.governorate_id || "", value)}
                                disabled={!filters.governorate_id || isLoadingCities}
                              >
                                <SelectTrigger id="city-filter" className="h-10 bg-background" disabled={!filters.governorate_id || isLoadingCities}>
                                  <SelectValue
                                    placeholder={
                                      isLoadingCities
                                        ? t("loadingCities")
                                        : filters.governorate_id
                                          ? t("selectCity")
                                          : locale === "ar"
                                            ? "اختر المحافظة أولاً"
                                            : "Select governorate first"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.id.toString()}>
                                      {locale === "ar" ? city.name_ar : city.name_en}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {(filters.governorate_id || filters.city_id) && (
                            <div className="flex items-center gap-2 flex-wrap pt-2">
                              {filters.governorate_id && (
                                <Badge variant="secondary" className="gap-1.5">
                                  {t("governorate")}:{" "}
                                  {governorates.find((g) => g.id.toString() === filters.governorate_id)
                                    ? locale === "ar"
                                      ? governorates.find((g) => g.id.toString() === filters.governorate_id)!.name_ar
                                      : governorates.find((g) => g.id.toString() === filters.governorate_id)!.name_en
                                    : filters.governorate_id}
                                  <button
                                    onClick={() => handleLocationFilterChange("")}
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              )}
                              {filters.city_id && (
                                <Badge variant="secondary" className="gap-1.5">
                                  {t("city")}:{" "}
                                  {cities.find((c) => c.id.toString() === filters.city_id)
                                    ? locale === "ar"
                                      ? cities.find((c) => c.id.toString() === filters.city_id)!.name_ar
                                      : cities.find((c) => c.id.toString() === filters.city_id)!.name_en
                                    : filters.city_id}
                                  <button
                                    onClick={() => handleLocationFilterChange(filters.governorate_id || "", "")}
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count & View Toggle */}
      {!isLoading && filteredInventories.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredInventories.length === inventories.length
              ? `${filteredInventories.length} ${filteredInventories.length === 1 ? 'inventory' : 'inventories'}`
              : `Showing ${filteredInventories.length} of ${inventories.length} inventories`
            }
          </p>
          <ViewToggle
            view={viewType}
            onViewChange={setViewType}
            cardLabel={t("cardView")}
            tableLabel={t("tableView")}
          />
        </div>
      )}

      {/* Inventories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInventories.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-16 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Warehouse className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('noInventories')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery || Object.values(filters).some(v => v) 
                    ? 'No inventories match your search criteria. Try adjusting your filters.'
                    : t('noInventoriesDesc')
                  }
                </p>
              </div>
              {canCreateInventory && !searchQuery && !Object.values(filters).some(v => v) && (
                <Button onClick={() => router.push('/dashboard/inventory/new')} className="gap-2 mt-2">
                  <Plus className="h-4 w-4" />
                  {t('createInventory')}
                </Button>
              )}
              {(searchQuery || Object.values(filters).some(v => v)) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    handleClearFilters();
                  }}
                  className="gap-2 mt-2"
                >
                  {tCommon('clearAll')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewType === "table" ? (
        <InventoryTable
          inventories={filteredInventories}
          canUpdateInventory={canUpdateInventory}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventories.map((inventory) => {
            const displayName = locale === 'ar' && inventory.name_ar
              ? inventory.name_ar
              : inventory.name_en || inventory.name || t('unnamedInventory');

            return (
              <div
                key={inventory.id}
                onClick={() => router.push(`/dashboard/inventory/${inventory.id}`)}
                className="group relative cursor-pointer"
              >
                {/* Card Container with glassmorphism */}
                <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                  {/* Gradient Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Section - Icon & Name */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105">
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Warehouse className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Name & Location */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                          {displayName}
                        </h3>
                        {inventory.code && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                            {inventory.code}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {/* Status Badge */}
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            inventory.status === 'active' || inventory.is_active
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {inventory.status === 'active' || inventory.is_active ? t('active') : t('inactive')}
                          </div>
                          {inventory.city && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs truncate">
                                {locale === 'ar' ? inventory.city.name_ar : inventory.city.name_en}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 pb-3">
                    {inventory.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mb-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span dir="ltr" className="truncate text-xs">{inventory.phone}</span>
                      </div>
                    )}
                    {inventory.address && (
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {inventory.address}
                      </p>
                    )}
                  </div>

                  {/* Created Date Badge */}
                  {inventory.created_at && (
                    <div className="px-5 pb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                        <span className="font-medium">{tCommon('createdOn')}</span>
                        <span>{new Date(inventory.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="px-5 pb-4 pt-2 border-t border-border/40 relative z-10">
                    <div className="flex items-center justify-between">
                      {/* Edit Button */}
                      {canUpdateInventory ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/dashboard/inventory/${inventory.id}/edit`);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 me-1.5" />
                          {t('edit')}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          {t('viewDetails')}
                        </span>
                      )}
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                        <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!inventoryToDelete} onOpenChange={(open) => !open && setInventoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteInventory')}</DialogTitle>
            <DialogDescription>
              {t('deleteInventoryDesc', { 
                name: inventoryToDelete 
                  ? (locale === 'ar' && inventoryToDelete.name_ar 
                      ? inventoryToDelete.name_ar 
                      : inventoryToDelete.name_en || inventoryToDelete.name || t('unnamedInventory'))
                  : ''
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInventoryToDelete(null)}
              disabled={isDeleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
