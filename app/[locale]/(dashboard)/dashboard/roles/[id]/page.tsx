"use client";

import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleAvatar } from "@/components/ui/role-avatar";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Calendar,
  Key,
  Users,
  Shield,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { useRole, useDeleteRole } from "@/hooks/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ViewRolePage() {
  const t = useTranslations('roles');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const roleId = parseInt(params.id as string);

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.SHOW_ROLE] });
  const { hasPermission: canUpdateRole } = useHasPermission(PERMISSIONS.UPDATE_ROLE);
  const { hasPermission: canDeleteRole } = useHasPermission(PERMISSIONS.DELETE_ROLE);

  const { data: role, isLoading, error } = useRole(roleId);
  const deleteRoleMutation = useDeleteRole();

  const getRoleDisplayName = () => {
    if (!role) return '';
    const slug = locale === 'ar' ? role.slug_ar : role.slug_en;
    if (slug) return slug;

    // Safety check for undefined/null name
    if (!role.name) return '';
    return role.name.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDelete = async () => {
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      toast.success(t('roleDeleted'));
      router.push('/dashboard/roles');
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  if (error) {
    toast.error(t('errorLoadingRole'));
    router.push('/dashboard/roles');
    return null;
  }

  if (hasPermission === null || hasPermission === false || isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = getRoleDisplayName();
  const isSystemRole = ['super-admin', 'admin'].includes(role.name);

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/roles')}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToRoles')}
      </Button>

      {/* Hero Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 h-48 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative pt-24 px-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="h-28 w-28 rounded-2xl bg-background shadow-xl ring-4 ring-background overflow-hidden flex items-center justify-center">
                <RoleAvatar
                  roleId={role.id}
                  roleName={role.name}
                  size="xl"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                  <p className="text-muted-foreground mt-1">{role.name}</p>
                </div>
                {(canUpdateRole || canDeleteRole) && (
                  <div className="flex gap-2 shrink-0">
                    {canUpdateRole && (
                      <Button
                        onClick={() => router.push(`/dashboard/roles/${role.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {tCommon('edit')}
                      </Button>
                    )}
                    {canDeleteRole && !isSystemRole && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            {tCommon('delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteRole')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('deleteConfirm', { name: displayName })}
                              <br />
                              <span className="text-destructive">{t('deleteWarning')}</span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteRoleMutation.isPending ? t('deleting') : tCommon('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="text-xs px-3 py-1.5">
                  <Shield className="h-3 w-3 me-1.5" />
                  {role.guard_name}
                </Badge>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Key className="h-3 w-3" />
                  {t('permissionCount', { count: role.permissions?.length || 0 })}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Users className="h-3 w-3" />
                  {t('usersWithRole', { count: role.users_count || 0 })}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t('createdOn')} {new Date(role.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Basic Info Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">{t('roleDetails')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('roleName')}</p>
              <p className="font-medium text-sm">{role.name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{t('slugEn')}</p>
              <p className="font-medium text-sm">{role.slug_en || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{t('slugAr')}</p>
              <p className="font-medium text-sm" dir="rtl">{role.slug_ar || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{t('guardName')}</p>
              <p className="font-medium text-sm">{role.guard_name}</p>
            </div>
          </div>
        </div>

        {/* Permissions Card - spans 2 columns */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Key className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="font-semibold">{t('permissions')}</h3>
            <Badge variant="secondary" className="ms-auto">
              {role.permissions?.length || 0}
            </Badge>
          </div>

          {role.permissions && role.permissions.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {role.permissions.map(permission => (
                <div
                  key={permission.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{permission.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noPermissions')}</p>
          )}
        </div>

      </div>

      {/* Timeline / Dates */}
      <div className="flex items-center justify-center gap-8 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{t('createdOn')}: {new Date(role.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{tCommon('lastUpdated')}: {new Date(role.updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
