"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleAvatar } from "@/components/ui/role-avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Eye,
  Calendar,
  Shield,
  Edit,
  RefreshCw,
  Users,
  Key,
  Search,
  X,
} from "lucide-react";
import { useRoles } from "@/hooks/queries";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { useRouter } from "@/i18n/routing";
import { ViewToggle, type ViewType } from "@/components/ui/view-toggle";
import { RoleTable } from "@/components/roles/role-table";

export default function RolesPage() {
  const t = useTranslations('roles');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_ROLES] });

  // Permission checks for actions
  const { hasPermission: canCreateRole } = useHasPermission(PERMISSIONS.CREATE_ROLE);
  const { hasPermission: canUpdateRole } = useHasPermission(PERMISSIONS.UPDATE_ROLE);

  // React Query hooks - data is automatically cached!
  const {
    data: rolesResponse,
    isLoading,
    isFetching,
    refetch: refetchRoles,
  } = useRoles();

  // View toggle state
  const [viewType, setViewType] = useState<ViewType>("cards");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // System role names
  const systemRoleNames = ['super-admin', 'admin', 'manager', 'viewer', 'inventory-manager', 'order-preparer', 'shipping-agent', 'vendor'];

  // Derived data with filtering
  const allRoles = useMemo(() => rolesResponse?.data || [], [rolesResponse?.data]);

  // Apply filters
  const roles = useMemo(() => {
    let filtered = allRoles;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.slug_en?.toLowerCase().includes(query) ||
        role.slug_ar?.toLowerCase().includes(query)
      );
    }

    // Type filter (system/custom)
    if (typeFilter === "system") {
      filtered = filtered.filter(role => systemRoleNames.includes(role.name));
    } else if (typeFilter === "custom") {
      filtered = filtered.filter(role => !systemRoleNames.includes(role.name));
    }

    return filtered;
  }, [allRoles, searchQuery, typeFilter, systemRoleNames]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setTypeFilter("all");
  }, []);

  const hasActiveFilters = searchQuery || typeFilter !== "all";

  const getRoleDisplayName = (role: typeof roles[0]) => {
    const slug = locale === 'ar' ? role.slug_ar : role.slug_en;
    if (slug) return slug;

    // Safety check for undefined/null name
    if (!role.name) return '';
    return role.name.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Stats (based on all roles, not filtered)
  const stats = useMemo(() => {
    return {
      total: allRoles.length,
      system: allRoles.filter(r => systemRoleNames.includes(r.name)).length,
      custom: allRoles.filter(r => !systemRoleNames.includes(r.name)).length,
    };
  }, [allRoles, systemRoleNames]);

  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Refresh button shows when fetching in background */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchRoles()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {canCreateRole && (
            <Button onClick={() => router.push('/dashboard/roles/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addRole')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchRoles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('allRoles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allRoles')}</SelectItem>
                <SelectItem value="system">{t('systemRoles')}</SelectItem>
                <SelectItem value="custom">{t('customRoles')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={handleClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalRoles')}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('systemRoles')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.system}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('customRoles')}</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.custom}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Count & View Toggle */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? t('showingFilteredRoles', { count: roles.length, total: allRoles.length })
              : `${roles.length} ${roles.length === 1 ? 'role' : 'roles'}`
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-3 text-muted-foreground">{t('loadingRoles')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Roles Table or Grid */}
          {viewType === "table" ? (
            <RoleTable roles={roles} canUpdateRole={canUpdateRole} />
          ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => {
              const displayName = getRoleDisplayName(role);
              const permissionCount = role.permissions?.length || 0;
              const usersCount = role.users_count || 0;

              return (
                <div
                  key={role.id}
                  onClick={() => router.push(`/dashboard/roles/${role.id}`)}
                  className="group relative cursor-pointer"
                >
                  {/* Card Container */}
                  <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-300 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                    {/* Gradient Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Main Content */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <RoleAvatar
                            roleId={role.id}
                            roleName={role.name}
                            size="lg"
                            className="ring-2 ring-border/50 transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        {/* Name & Guard */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                              {displayName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Guard Badge */}
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-medium">
                              {role.guard_name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="px-5 pb-4 space-y-2">
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Key className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                        <span>{t('permissionCount', { count: permissionCount })}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                        <span>{t('usersWithRole', { count: usersCount })}</span>
                      </div>
                    </div>

                    {/* Date Badge */}
                    <div className="px-5 pb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{t('createdOn')} {new Date(role.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="px-5 pb-4 pt-2 border-t border-border/40 relative z-10">
                      <div className="flex items-center justify-between">
                        {/* Edit Button */}
                        {canUpdateRole ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/dashboard/roles/${role.id}/edit`);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 me-1.5" />
                            {tCommon('edit')}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 font-medium">
                            {t('view')}
                          </span>
                        )}
                        {/* Arrow Icon */}
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                          <Eye className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Empty State */}
          {roles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">
                {hasActiveFilters ? t('noMatchingRoles') : t('noRoles')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters ? t('noMatchingRolesDesc') : t('noRolesDesc')}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} className="mt-4">
                  {tCommon('clearFilters')}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
