"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Mail,
  Phone,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Calendar,
  Shield,
  Edit,
  Users,
  RefreshCw,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Hash,
  CheckCircle2,
  Warehouse
} from "lucide-react";
import { User, UserFilters, getRoleDisplayName, userHasRole } from "@/lib/services/users";
import {
  validateEgyptianMobile,
  validateEmail,
  validateRequired,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/validations";
import {
  useUsers,
  useCreateUser,
  useChangeUserPassword,
  useAssignUserRole,
  useRoles,
} from "@/hooks/queries";
import { fetchInventories, fetchUserInventories, type Inventory } from "@/lib/services/inventories";
import { useQuery } from "@tanstack/react-query";

// User Card Component
interface UserCardProps {
  user: User;
  displayName: string;
  currentUser: ReturnType<typeof getCurrentUser>;
  locale: string;
  router: ReturnType<typeof useRouter>;
  canUpdateUser: boolean;
  t: ReturnType<typeof useTranslations<'users'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
  getLocalizedRoleDisplay: (user: User) => string;
}

function UserCard({
  user,
  displayName,
  currentUser,
  locale,
  router,
  canUpdateUser,
  t,
  tCommon,
  getLocalizedRoleDisplay,
}: UserCardProps) {
  const isDeliveryAgent = userHasRole(user, 'shipping-agent');
  const isInventoryManager = userHasRole(user, 'inventory-manager');
  const shouldShowInventories = isDeliveryAgent || isInventoryManager;
  
  // Fetch inventories for delivery agents and inventory managers
  const { data: userInventories = [] } = useQuery<Inventory[]>({
    queryKey: ['user-inventories', user.id],
    queryFn: () => fetchUserInventories(user.id),
    enabled: shouldShowInventories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div
      onClick={() => router.push(`/dashboard/users/${user.id}`)}
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
              <UserAvatar
                userId={user.id}
                name={displayName}
                role={user.roles?.[0]?.name}
                size="lg"
                className="ring-2 ring-border/50 transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                  {displayName}
                </h3>
                {currentUser?.id === user.id && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                    {t('me')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* Status Badge */}
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  user.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {user.status === 'active' ? t('active') : t('inactive')}
                </div>
                {user.roles && user.roles.length > 0 ? (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 font-medium">
                    <Shield className="h-3 w-3 me-1" />
                    {getLocalizedRoleDisplay(user)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5">
                    {t('noRole')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-5 pb-4 space-y-2">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{user.email || t('noEmail')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span dir="ltr">{user.mobile}</span>
          </div>
          
          {/* Inventories for Delivery Agents and Inventory Managers */}
          {shouldShowInventories && userInventories.length > 0 && (
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground pt-1">
              <Warehouse className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('assignedInventories')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {userInventories.map((inventory) => (
                    <Badge
                      key={inventory.id}
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 h-5 font-medium bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/dashboard/inventory/${inventory.id}`);
                      }}
                    >
                      {locale === 'ar' ? inventory.name_ar : inventory.name_en || inventory.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          {shouldShowInventories && userInventories.length === 0 && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground/70 pt-1">
              <Warehouse className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <span>{t('noAssignedInventories')}</span>
            </div>
          )}
        </div>

        {/* Date Badge */}
        <div className="px-5 pb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{t('since')} {new Date(user.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="px-5 pb-4 pt-2 border-t border-border/40 relative z-10">
          <div className="flex items-center justify-between">
            {/* Edit Button */}
            {canUpdateUser && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/dashboard/users/${user.id}/edit`);
                }}
              >
                <Edit className="h-3.5 w-3.5 me-1.5" />
                {tCommon('edit')}
              </Button>
            )}
            {!canUpdateUser && (
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
}

import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { getCurrentUser, logout } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const router = useRouter();

  const currentUser = getCurrentUser();
  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.LIST_USERS] });

  // Permission checks for actions
  const { hasPermission: canCreateUser } = useHasPermission(PERMISSIONS.CREATE_USER);
  const { hasPermission: canUpdateUser } = useHasPermission(PERMISSIONS.UPDATE_USER);

  // Pagination and filters state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    userInfo: true,
    status: false,
    role: false,
    inventory: false,
  });

  // Inventories for filter
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);

  // React Query hooks - data is automatically cached!
  const {
    data: usersResponse,
    isLoading,
    isFetching,
    refetch: refetchUsers,
  } = useUsers(currentPage, 50, appliedFilters);

  const { data: rolesResponse } = useRoles();

  // Load inventories for filter
  useEffect(() => {
    const loadInventories = async () => {
      setIsLoadingInventories(true);
      try {
        const fetchedInventories = await fetchInventories();
        setInventories(fetchedInventories);
      } catch {
        // Silently fail - inventories filter is optional
      } finally {
        setIsLoadingInventories(false);
      }
    };
    loadInventories();
  }, []);

  // Mutations with automatic cache invalidation
  const createUserMutation = useCreateUser();
  const changePasswordMutation = useChangeUserPassword();
  const assignRoleMutation = useAssignUserRole();

  // Derived data
  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta || null;
  const availableRoles = rolesResponse?.data || [];

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    roleId: null as number | null,
    status: 'active' as 'active' | 'inactive',
  });

  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [userToAssignRole, setUserToAssignRole] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const getDisplayName = useCallback((user: User) => {
    return locale === 'ar' ? user.name_ar : user.name_en;
  }, [locale]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const filtersToApply: UserFilters = { ...filters };
    
    // Add search query to filters if it exists
    if (searchQuery.trim()) {
      if (locale === 'ar') {
        filtersToApply.name_ar = searchQuery.trim();
      } else {
        filtersToApply.name_en = searchQuery.trim();
      }
    } else {
      // Remove name filters if search is empty
      delete filtersToApply.name_ar;
      delete filtersToApply.name_en;
    }
    
    setAppliedFilters(filtersToApply);
    setCurrentPage(1);
  }, [filters, searchQuery, locale]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  const getLocalizedRoleDisplay = useCallback((user: User) => {
    if (!user.roles || user.roles.length === 0) return t('noRole');
    return getRoleDisplayName(user.roles[0], locale);
  }, [locale, t]);

  // Helper to get role display name from Role object (for select dropdowns)
  const getRoleSelectDisplay = useCallback((role: { name: string; slug_en: string | null; slug_ar: string | null }) => {
    const slug = locale === 'ar' ? role.slug_ar : role.slug_en;
    if (slug) return slug;
    // Safety check for undefined/null name
    if (!role.name) return '';
    return role.name.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, [locale]);

  const handleCreateUser = useCallback(async () => {
    // Validate required fields
    if (!validateRequired(addFormData.name_en).isValid) {
      toast.error(tValidation('fieldRequired'), { description: t('nameEnRequired') });
      return;
    }
    if (!validateRequired(addFormData.name_ar).isValid) {
      toast.error(tValidation('fieldRequired'), { description: t('nameArRequired') });
      return;
    }

    // Validate email
    const emailValidation = validateEmail(addFormData.email);
    if (!emailValidation.isValid) {
      toast.error(tValidation(emailValidation.message || 'emailInvalidFormat'));
      return;
    }

    // Validate mobile (Egyptian format)
    const mobileValidation = validateEgyptianMobile(addFormData.mobile);
    if (!mobileValidation.isValid) {
      toast.error(tValidation(mobileValidation.message || 'mobileInvalid'));
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(addFormData.password);
    if (!passwordValidation.isValid) {
      toast.error(tValidation(passwordValidation.message || 'passwordRequired'));
      return;
    }

    // Validate password confirmation
    const confirmValidation = validatePasswordConfirmation(addFormData.password, addFormData.confirmPassword);
    if (!confirmValidation.isValid) {
      toast.error(tValidation(confirmValidation.message || 'passwordsDoNotMatch'));
      return;
    }

    // Validate role selection
    if (!addFormData.roleId) {
      toast.error(tValidation('selectionRequired'));
      return;
    }

    try {
      const newUser = await createUserMutation.mutateAsync({
        name: addFormData.name_en,
        name_en: addFormData.name_en,
        name_ar: addFormData.name_ar,
        email: addFormData.email,
        mobile: addFormData.mobile,
        password: addFormData.password,
        password_confirmation: addFormData.confirmPassword,
        status: addFormData.status,
      });

      if (addFormData.roleId) {
        await assignRoleMutation.mutateAsync({
          userId: newUser.id,
          roleId: addFormData.roleId,
        });
      }

      toast.success(t('createSuccess'));
      setShowAddDialog(false);
      setAddFormData({
        name_en: '',
        name_ar: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        roleId: null,
        status: 'active',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('createFailed');
      toast.error(t('createFailed'), { description: message });
    }
  }, [addFormData, t, tValidation, createUserMutation, assignRoleMutation]);

  const handleChangePassword = useCallback(async () => {
    if (!userToChangePassword) return;

    // Validate password
    const passwordValidation = validatePassword(passwordFormData.password);
    if (!passwordValidation.isValid) {
      toast.error(tValidation(passwordValidation.message || 'passwordRequired'));
      return;
    }

    // Validate password confirmation
    const confirmValidation = validatePasswordConfirmation(passwordFormData.password, passwordFormData.confirmPassword);
    if (!confirmValidation.isValid) {
      toast.error(tValidation(confirmValidation.message || 'passwordsDoNotMatch'));
      return;
    }

    const isOwnPassword = userToChangePassword.id === currentUser?.id;

    try {
      await changePasswordMutation.mutateAsync({
        id: userToChangePassword.id,
        password: passwordFormData.password,
        confirmPassword: passwordFormData.confirmPassword,
      });

      toast.success(t('passwordChangeSuccess'));
      setUserToChangePassword(null);
      setPasswordFormData({ password: '', confirmPassword: '' });

      if (isOwnPassword) {
        toast.info(t('ownPasswordChanged'), { description: t('pleaseLoginAgain') });
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1500);
      } else {
        toast.info(t('userWillBeLoggedOut', { name: getDisplayName(userToChangePassword) }));
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMessages = Object.values((error as { errors: Record<string, string[]> }).errors).flat().join(', ');
        toast.error(t('passwordChangeFailed'), { description: errorMessages });
      } else {
        const message = error instanceof Error ? error.message : t('passwordChangeFailed');
        toast.error(t('passwordChangeFailed'), { description: message });
      }
    }
  }, [userToChangePassword, passwordFormData, currentUser?.id, t, tValidation, router, getDisplayName, changePasswordMutation]);

  const handleAssignRole = useCallback(async () => {
    if (!userToAssignRole || !selectedRoleId) return;

    try {
      await assignRoleMutation.mutateAsync({
        userId: userToAssignRole.id,
        roleId: selectedRoleId,
      });
      toast.success(t('assignRoleSuccess'));
      setUserToAssignRole(null);
      setSelectedRoleId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('assignRoleFailed'), { description: message });
    }
  }, [userToAssignRole, selectedRoleId, t, tCommon, assignRoleMutation]);

  // Stats
  const stats = useMemo(() => ({
    total: meta?.total || 0,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  }), [meta?.total, users]);

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
            {t('totalUsers', { count: stats.total })}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Refresh button shows when fetching in background */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchUsers()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {canCreateUser && (
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t('addUser')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalUsersLabel')}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('activeUsers')}</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('inactiveUsers')}</p>
              <p className="text-2xl font-bold text-amber-600">{stats.inactive}</p>
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
                placeholder={t("searchUsers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
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
                  onClick={handleClearAllFilters}
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
                    {/* User Information */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, userInfo: !prev.userInfo }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("userInformation")}</Label>
                          {(filters.id || filters.email || filters.mobile || (locale === 'ar' ? filters.name_ar : filters.name_en)) && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                              {(filters.id ? 1 : 0) + (filters.email ? 1 : 0) + (filters.mobile ? 1 : 0) + ((locale === 'ar' ? filters.name_ar : filters.name_en) ? 1 : 0)}
                            </Badge>
                          )}
                        </div>
                        {expandedSections.userInfo ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.userInfo && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="name-filter" className="text-xs text-muted-foreground font-medium">
                              {t("name")}
                            </Label>
                            <Input
                              id="name-filter"
                              value={(locale === 'ar' ? filters.name_ar : filters.name_en) || ""}
                              onChange={(e) => handleFilterChange(locale === 'ar' ? 'name_ar' : 'name_en', e.target.value)}
                              placeholder={t("searchByNamePlaceholder")}
                              className="h-10 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="id-filter" className="text-xs text-muted-foreground font-medium">
                              {t("id")}
                            </Label>
                            <Input
                              id="id-filter"
                              value={filters.id || ""}
                              onChange={(e) => handleFilterChange("id", e.target.value)}
                              placeholder={t("enterIdPlaceholder")}
                              className="h-10 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email-filter" className="text-xs text-muted-foreground font-medium">
                              {t("email")}
                            </Label>
                            <Input
                              id="email-filter"
                              value={filters.email || ""}
                              onChange={(e) => handleFilterChange("email", e.target.value)}
                              placeholder={t("searchByEmailPlaceholder")}
                              className="h-10 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mobile-filter" className="text-xs text-muted-foreground font-medium">
                              {t("mobile")}
                            </Label>
                            <Input
                              id="mobile-filter"
                              value={filters.mobile || ""}
                              onChange={(e) => handleFilterChange("mobile", e.target.value)}
                              placeholder={t("searchByMobilePlaceholder")}
                              className="h-10 bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
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
                              <SelectValue placeholder={t("allStatus")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t("active")}</SelectItem>
                              <SelectItem value="inactive">{t("inactive")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, role: !prev.role }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("role")}</Label>
                          {filters.role_id && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                          )}
                        </div>
                        {expandedSections.role ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.role && (
                        <div className="space-y-2">
                          <Label htmlFor="role-filter" className="text-xs text-muted-foreground font-medium">
                            {t("role")}
                          </Label>
                          <Select
                            value={filters.role_id || undefined}
                            onValueChange={(value) => handleFilterChange("role_id", value)}
                          >
                            <SelectTrigger id="role-filter" className="h-10 bg-background">
                              <SelectValue placeholder={t("selectRole")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {getRoleSelectDisplay(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Inventory */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, inventory: !prev.inventory }))}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold text-foreground">{t("inventory")}</Label>
                          {filters.inventory_id && (
                            <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                          )}
                        </div>
                        {expandedSections.inventory ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSections.inventory && (
                        <div className="space-y-2">
                          <Label htmlFor="inventory-filter" className="text-xs text-muted-foreground font-medium">
                            {t("inventory")}
                          </Label>
                          <Select
                            value={filters.inventory_id || undefined}
                            onValueChange={(value) => handleFilterChange("inventory_id", value)}
                            disabled={isLoadingInventories}
                          >
                            <SelectTrigger id="inventory-filter" className="h-10 bg-background" disabled={isLoadingInventories}>
                              <SelectValue placeholder={isLoadingInventories ? t("loading") : t("selectInventory")} />
                            </SelectTrigger>
                            <SelectContent>
                              {inventories.map((inventory) => (
                                <SelectItem key={inventory.id} value={inventory.id.toString()}>
                                  {locale === "ar" ? inventory.name_ar : inventory.name_en || inventory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleClearFilters} className="min-w-[100px]">
                    {tCommon("clear")}
                  </Button>
                  <Button onClick={handleApplyFilters} className="min-w-[100px]">
                    {tCommon("apply")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {(Object.keys(appliedFilters).length > 0 || searchQuery.trim()) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery.trim() && (
            <Badge variant="secondary" className="gap-1.5">
              {t("name")}: {searchQuery}
              <button
                onClick={() => {
                  setSearchQuery("");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.id && (
            <Badge variant="secondary" className="gap-1.5">
              {t("id")}: {appliedFilters.id}
              <button
                onClick={() => {
                  handleFilterChange("id", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.email && (
            <Badge variant="secondary" className="gap-1.5">
              {t("email")}: {appliedFilters.email}
              <button
                onClick={() => {
                  handleFilterChange("email", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.mobile && (
            <Badge variant="secondary" className="gap-1.5">
              {t("mobile")}: {appliedFilters.mobile}
              <button
                onClick={() => {
                  handleFilterChange("mobile", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.status && (
            <Badge variant="secondary" className="gap-1.5">
              {t("status")}: {appliedFilters.status === 'active' ? t("active") : t("inactive")}
              <button
                onClick={() => {
                  handleFilterChange("status", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.role_id && (
            <Badge variant="secondary" className="gap-1.5">
              {t("role")}: {getRoleSelectDisplay(availableRoles.find(r => r.id.toString() === appliedFilters.role_id) || { name: '', slug_en: null, slug_ar: null })}
              <button
                onClick={() => {
                  handleFilterChange("role_id", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {appliedFilters.inventory_id && (
            <Badge variant="secondary" className="gap-1.5">
              {t("inventory")}: {locale === "ar" ? inventories.find(i => i.id.toString() === appliedFilters.inventory_id)?.name_ar : inventories.find(i => i.id.toString() === appliedFilters.inventory_id)?.name_en || inventories.find(i => i.id.toString() === appliedFilters.inventory_id)?.name}
              <button
                onClick={() => {
                  handleFilterChange("inventory_id", "");
                  handleApplyFilters();
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-3 text-muted-foreground">{t('loadingUsers')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Users Grid - 3 Cards per row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                displayName={getDisplayName(user)}
                currentUser={currentUser}
                locale={locale}
                router={router}
                canUpdateUser={canUpdateUser}
                t={t}
                tCommon={tCommon}
                getLocalizedRoleDisplay={getLocalizedRoleDisplay}
              />
            ))}
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">{tCommon('noData')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {t('page')} {meta.current_page} {t('of')} {meta.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 me-1" />
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(meta.last_page, prev + 1))}
                  disabled={currentPage === meta.last_page}
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('addUserTitle')}</DialogTitle>
            <DialogDescription>{t('addUserDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_name_en">{t('nameEnglish')} *</Label>
                <Input
                  id="add_name_en"
                  value={addFormData.name_en}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_name_ar">{t('nameArabic')} *</Label>
                <Input
                  id="add_name_ar"
                  value={addFormData.name_ar}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                  disabled={createUserMutation.isPending}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_email">{t('email')} *</Label>
                <Input
                  id="add_email"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_mobile">{t('mobile')} *</Label>
                <Input
                  id="add_mobile"
                  value={addFormData.mobile}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  disabled={createUserMutation.isPending}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_password">{t('password')} *</Label>
                <Input
                  id="add_password"
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_confirm_password">{t('confirmPassword')} *</Label>
                <Input
                  id="add_confirm_password"
                  type="password"
                  value={addFormData.confirmPassword}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={createUserMutation.isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_role">{t('role')} *</Label>
                <Select
                  value={addFormData.roleId?.toString() || ''}
                  onValueChange={(value) => setAddFormData(prev => ({ ...prev, roleId: Number(value) }))}
                  disabled={createUserMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {getRoleSelectDisplay(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_status">{t('status')}</Label>
                <Select
                  value={addFormData.status}
                  onValueChange={(value: 'active' | 'inactive') => setAddFormData(prev => ({ ...prev, status: value }))}
                  disabled={createUserMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={createUserMutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('addUser')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!userToChangePassword} onOpenChange={() => setUserToChangePassword(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>
              {userToChangePassword && t('changePasswordDesc', { name: getDisplayName(userToChangePassword) })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">{t('newPassword')} *</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordFormData.password}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={changePasswordMutation.isPending}
                placeholder={t('enterNewPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_new_password">{t('confirmPassword')} *</Label>
              <Input
                id="confirm_new_password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={changePasswordMutation.isPending}
                placeholder={t('confirmNewPassword')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToChangePassword(null)} disabled={changePasswordMutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('changingPassword')}
                </>
              ) : (
                t('changePassword')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={!!userToAssignRole} onOpenChange={() => setUserToAssignRole(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('assignRole')}</DialogTitle>
            <DialogDescription>
              {userToAssignRole && t('assignRoleDesc', { name: getDisplayName(userToAssignRole) })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">{t('role')} *</Label>
              <Select
                value={selectedRoleId?.toString() || ''}
                onValueChange={(value) => setSelectedRoleId(Number(value))}
                disabled={assignRoleMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {getRoleSelectDisplay(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToAssignRole(null)} disabled={assignRoleMutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAssignRole} disabled={assignRoleMutation.isPending || !selectedRoleId}>
              {assignRoleMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('assigning')}
                </>
              ) : (
                t('assignRole')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
