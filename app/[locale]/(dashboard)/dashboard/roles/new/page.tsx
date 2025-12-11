"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Shield, Search } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { useCreateRole, usePermissions } from "@/hooks/queries";

export default function CreateRolePage() {
  const t = useTranslations('roles');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.CREATE_ROLE] });

  // Permission search state
  const [permissionSearch, setPermissionSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce permission search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(permissionSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [permissionSearch]);

  const { data: permissionsResponse, isLoading: isLoadingPermissions, isFetching: isFetchingPermissions } = usePermissions(
    1,
    debouncedSearch ? { name: debouncedSearch } : undefined
  );
  const createRoleMutation = useCreateRole();

  const [formData, setFormData] = useState({
    name: '',
    slug_en: '',
    slug_ar: '',
    permissions: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const allPermissions = useMemo(() => permissionsResponse?.data || [], [permissionsResponse?.data]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  }, [errors]);

  const handlePermissionToggle = useCallback((permissionId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId),
    }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked ? allPermissions.map(p => p.id) : [],
    }));
  }, [allPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const validationErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      validationErrors.name = t('nameRequired');
    }

    if (!formData.slug_en.trim()) {
      validationErrors.slug_en = t('slugEnRequired');
    }

    if (!formData.slug_ar.trim()) {
      validationErrors.slug_ar = t('slugArRequired');
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const newRole = await createRoleMutation.mutateAsync({
        name: formData.name,
        slug_en: formData.slug_en,
        slug_ar: formData.slug_ar,
        permissions: formData.permissions,
      });
      toast.success(t('roleCreated'));
      router.push(`/dashboard/roles/${newRole.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('createFailed');
      toast.error(t('createFailed'), { description: errorMessage });
    }
  };

  const allSelected = allPermissions.length > 0 && formData.permissions.length === allPermissions.length;
  const selectedCount = formData.permissions.length;

  if (hasPermission === null || hasPermission === false || isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/roles')}
          disabled={createRoleMutation.isPending}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('addRole')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInformation')}</CardTitle>
              <CardDescription>{t('basicInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('roleName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={createRoleMutation.isPending}
                  placeholder="e.g., custom-role"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug_en">{t('slugEn')} *</Label>
                  <Input
                    id="slug_en"
                    value={formData.slug_en}
                    onChange={handleInputChange}
                    disabled={createRoleMutation.isPending}
                    placeholder="e.g., Custom Role"
                    className={errors.slug_en ? "border-red-500" : ""}
                  />
                  {errors.slug_en && (
                    <p className="text-sm text-red-500">{errors.slug_en}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug_ar">{t('slugAr')} *</Label>
                  <Input
                    id="slug_ar"
                    value={formData.slug_ar}
                    onChange={handleInputChange}
                    disabled={createRoleMutation.isPending}
                    dir="rtl"
                    placeholder="مثال: دور مخصص"
                    className={errors.slug_ar ? "border-red-500" : ""}
                  />
                  {errors.slug_ar && (
                    <p className="text-sm text-red-500">{errors.slug_ar}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('permissionsSection')}</CardTitle>
                    <CardDescription>
                      {t('permissionsSectionDesc')}
                      {selectedCount > 0 && (
                        <span className="ms-2 text-primary font-medium">
                          ({t('selectedCount', { count: selectedCount })})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {allPermissions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        disabled={createRoleMutation.isPending}
                      />
                      <Label htmlFor="select-all" className="text-sm cursor-pointer">
                        {t('selectAll')}
                      </Label>
                    </div>
                  )}
                </div>
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPermissions')}
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    disabled={createRoleMutation.isPending}
                    className="ps-9"
                  />
                  {isFetchingPermissions && (
                    <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allPermissions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allPermissions.map(permission => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked === true)}
                        disabled={createRoleMutation.isPending}
                      />
                      <Label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {permissionSearch ? t('noPermissionsFound') : t('noPermissions')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/roles')}
              disabled={createRoleMutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending}
              size="lg"
            >
              {createRoleMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Shield className="me-2 h-4 w-4" />
                  {t('createRole')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
