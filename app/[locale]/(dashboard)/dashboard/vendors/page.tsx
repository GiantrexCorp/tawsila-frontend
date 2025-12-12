"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Loader2, MapPin, ArrowUpRight, Edit, Search, X, Filter, ChevronDown, ChevronUp, Hash, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchVendors, fetchGovernorates, fetchCities, type Vendor, type Governorate, type City } from "@/lib/services/vendors";
import { ViewToggle, type ViewType } from "@/components/ui/view-toggle";
import { VendorTable } from "@/components/vendors/vendor-table";

export default function VendorsPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  // Check if user has permission to access vendors page
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_VENDORS] });

  // Permission checks for actions
  const { hasPermission: canCreateVendor } = useHasPermission(PERMISSIONS.CREATE_VENDOR);
  const { hasPermission: canUpdateVendor } = useHasPermission(PERMISSIONS.UPDATE_VENDOR);

  // Vendors state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vendorInfo: true,
    location: false,
    status: false,
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

  // Load cities when governorate is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.governorate_id) {
        setCities([]);
        return;
      }

      setIsLoadingCities(true);
      try {
        const fetchedCities = await fetchCities(parseInt(filters.governorate_id));
        setCities(fetchedCities);
        // Clear city filter if governorate changes
        if (filters.city_id) {
          setFilters((prev) => ({ ...prev, city_id: "" }));
        }
      } catch {
        toast.error(t('errorLoadingCities'));
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, [filters.governorate_id, t]);

  // Load vendors on mount
  useEffect(() => {
    const loadVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const fetchedVendors = await fetchVendors();
        setVendors(fetchedVendors);
      } catch {
        toast.error(t('errorLoadingVendors'));
      } finally {
        setIsLoadingVendors(false);
      }
    };

    loadVendors();
  }, [t]);

  // Filter vendors based on search query and filters
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      // Search query (searches name)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameEn = (vendor.name_en || '').toLowerCase();
        const nameAr = (vendor.name_ar || '').toLowerCase();
        
        if (
          !nameEn.includes(searchLower) &&
          !nameAr.includes(searchLower)
        ) {
          return false;
        }
      }

      // Name filter
      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        const nameEn = (vendor.name_en || '').toLowerCase();
        const nameAr = (vendor.name_ar || '').toLowerCase();
        if (!nameEn.includes(searchLower) && !nameAr.includes(searchLower)) {
          return false;
        }
      }

      // Governorate filter
      if (filters.governorate_id) {
        const governorateId = parseInt(filters.governorate_id);
        if (vendor.governorate?.id !== governorateId) {
          return false;
        }
      }

      // City filter
      if (filters.city_id) {
        const cityId = parseInt(filters.city_id);
        if (vendor.city?.id !== cityId) {
          return false;
        }
      }

      // Status filter
      if (filters.status) {
        if (vendor.status !== filters.status) {
          return false;
        }
      }

      return true;
    });
  }, [vendors, filters, searchQuery]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleLocationFilterChange = useCallback((governorateId: string, cityId?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (governorateId) {
        newFilters.governorate_id = governorateId;
        if (cityId !== undefined) {
          newFilters.city_id = cityId;
        } else if (!cityId) {
          delete newFilters.city_id;
        }
      } else {
        delete newFilters.governorate_id;
        delete newFilters.city_id;
      }
      return newFilters;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

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
        {canCreateVendor && (
          <Button className="w-full sm:w-auto" onClick={() => router.push('/dashboard/vendors/new')}>
            <Plus className="h-4 w-4 me-2" />
            {t('addOrganization')}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalOrganizations')}</p>
            <p className="text-2xl font-bold">{isLoadingVendors ? '-' : filteredVendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('activeOrgs')}</p>
            <p className="text-2xl font-bold text-green-600">
              {isLoadingVendors ? '-' : filteredVendors.filter(v => v.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('inactiveOrgs')}</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {isLoadingVendors ? '-' : filteredVendors.filter(v => v.status === 'inactive').length}
            </p>
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
                placeholder={t("searchVendors")}
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
                    {/* Vendor Information */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, vendorInfo: !prev.vendorInfo }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("vendorInformation")}</Label>
                          {filters.name && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                          )}
                        </div>
                        {expandedSections.vendorInfo ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.vendorInfo && (
                        <div className="space-y-2">
                          <Label htmlFor="name-filter" className="text-xs text-muted-foreground font-medium">
                            {t("name")}
                          </Label>
                          <Input
                            id="name-filter"
                            value={filters.name || ""}
                            onChange={(e) => handleFilterChange("name", e.target.value)}
                            placeholder={t("searchVendors")}
                            className="h-10 bg-background"
                          />
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

                    {/* Status */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, status: !prev.status }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("status")}</Label>
                          {filters.status && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
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
                          <Label htmlFor="status-filter" className="text-xs text-muted-foreground font-medium">
                            {t("status")}
                          </Label>
                          <Select
                            value={filters.status || undefined}
                            onValueChange={(value) => handleFilterChange("status", value)}
                          >
                            <SelectTrigger id="status-filter" className="h-10 bg-background">
                              <SelectValue placeholder={t("selectStatus")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t("activeOrgs")}</SelectItem>
                              <SelectItem value="inactive">{t("inactiveOrgs")}</SelectItem>
                            </SelectContent>
                          </Select>
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
      {!isLoadingVendors && filteredVendors.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredVendors.length === vendors.length
              ? `${filteredVendors.length} ${filteredVendors.length === 1 ? 'vendor' : 'vendors'}`
              : `Showing ${filteredVendors.length} of ${vendors.length} vendors`
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

      {/* Vendors Grid */}
      {isLoadingVendors ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noVendors')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || Object.values(filters).some(v => v)
                ? 'No vendors match your search criteria. Try adjusting your filters.'
                : t('noVendorsDesc')
              }
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
      ) : viewType === "table" ? (
        <VendorTable
          vendors={filteredVendors}
          canUpdateVendor={canUpdateVendor}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
              className="group relative cursor-pointer"
            >
              {/* Card Container with glassmorphism */}
              <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                {/* Gradient Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Top Section - Logo & Name */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105">
                        {vendor.logo ? (
                          <Image
                            src={vendor.logo}
                            alt={locale === 'ar' ? vendor.name_ar : vendor.name_en}
                            width={56}
                            height={56}
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Location */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                        {locale === 'ar' ? vendor.name_ar : vendor.name_en}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {/* Status Badge */}
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          vendor.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs truncate">
                            {locale === 'ar' ? vendor.city?.name_ar : vendor.city?.name_en}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 pb-3">
                  <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {locale === 'ar' ? vendor.description_ar : vendor.description_en}
                  </p>
                </div>

                {/* Vendor Since Badge */}
                <div className="px-5 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                    <span className="font-medium">{t('vendorSince')}</span>
                    <span>{new Date(vendor.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="px-5 pb-4 pt-2 border-t border-border/40 relative z-10">
                  <div className="flex items-center justify-between">
                    {canUpdateVendor ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/vendors/${vendor.id}/edit`);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 me-1.5" />
                        {tCommon('edit')}
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 font-medium">
                        {tCommon('view')}
                      </span>
                    )}
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                      <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
