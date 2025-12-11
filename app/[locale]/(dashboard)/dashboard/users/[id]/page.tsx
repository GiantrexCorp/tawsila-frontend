"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Clock,
  Calendar,
  Shield,
  Edit,
  Key,
  UserCog
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchUser, changeUserPassword, assignUserRole, User } from "@/lib/services/users";
import { fetchRoles, Role } from "@/lib/services/roles";
import { toast } from "sonner";
import { getCurrentUser, logout } from "@/lib/auth";
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

export default function ViewUserPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const currentUser = getCurrentUser();

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.SHOW_USER] });

  // Permission checks for actions
  const { hasPermission: canUpdateUser } = useHasPermission(PERMISSIONS.UPDATE_USER);
  const { hasPermission: canChangePassword } = useHasPermission(PERMISSIONS.CHANGE_USER_PASSWORD);
  const { hasPermission: canAssignRole } = useHasPermission(PERMISSIONS.ASSIGN_USER_ROLE);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Change password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Assign role dialog
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!userId || isNaN(userId)) {
        toast.error(t('failedToLoad'), {
          description: tCommon('invalidOrderId'),
        });
        router.push('/dashboard/users');
        return;
      }

      setIsLoading(true);
      try {
        const [fetchedUser, rolesResponse] = await Promise.all([
          fetchUser(userId),
          fetchRoles()
        ]);
        setUser(fetchedUser);
        setAvailableRoles(rolesResponse.data);

        // Set initial role selection
        if (fetchedUser.roles && fetchedUser.roles.length > 0) {
          const currentRole = rolesResponse.data.find(r => r.name === fetchedUser.roles[0]);
          if (currentRole) {
            setSelectedRoleId(currentRole.id);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon('tryAgain');
        toast.error(t('failedToLoad'), { description: message });
        router.push('/dashboard/users');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadData();
    }
  }, [userId, hasPermission, t, tCommon, router]);

  const getDisplayName = (u: User) => {
    return locale === 'ar' ? u.name_ar : u.name_en;
  };

  const getRoleDisplayName = (roleName: string, roleData?: Role) => {
    if (roleData) {
      const slug = locale === 'ar' ? roleData.slug_ar : roleData.slug_en;
      if (slug) return slug;
    }

    const roleTranslationMap: Record<string, string> = {
      'super-admin': 'superAdmin',
      'admin': 'admin',
      'manager': 'manager',
      'viewer': 'viewer',
      'inventory-manager': 'inventoryManager',
      'order-preparer': 'orderPreparer',
      'shipping-agent': 'shippingAgent',
      'vendor': 'vendor',
    };

    const translationKey = roleTranslationMap[roleName];
    if (translationKey) return t(translationKey);

    return roleName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!passwordFormData.password) {
      toast.error(t('passwordRequired'));
      return;
    }

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (passwordFormData.password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    const isOwnPassword = user.id === currentUser?.id;

    setIsChangingPassword(true);
    try {
      await changeUserPassword(
        user.id,
        passwordFormData.password,
        passwordFormData.confirmPassword
      );

      toast.success(t('passwordChangeSuccess'));
      setShowPasswordDialog(false);
      setPasswordFormData({ password: '', confirmPassword: '' });

      if (isOwnPassword) {
        toast.info(t('ownPasswordChanged'), {
          description: t('pleaseLoginAgain'),
        });
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1500);
      } else {
        toast.info(t('userWillBeLoggedOut', { name: getDisplayName(user) }));
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMessages = Object.values((error as { errors: Record<string, string[]> }).errors).flat().join(', ');
        toast.error(t('passwordChangeFailed'), { description: errorMessages });
      } else {
        const message = error instanceof Error ? error.message : t('passwordChangeFailed');
        toast.error(t('passwordChangeFailed'), { description: message });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAssignRole = async () => {
    if (!user || !selectedRoleId) return;

    setIsAssigningRole(true);
    try {
      await assignUserRole(user.id, selectedRoleId);
      toast.success(t('assignRoleSuccess'));
      setShowRoleDialog(false);
      // Reload user to get updated roles
      const updatedUser = await fetchUser(userId);
      setUser(updatedUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('assignRoleFailed'), { description: message });
    } finally {
      setIsAssigningRole(false);
    }
  };

  if (hasPermission === null || hasPermission === false || isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const userRole = availableRoles.find(r => r.name === user.roles?.[0]);

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/users')}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('title')}
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
              <UserAvatar
                userId={user.id}
                name={displayName}
                role={user.roles?.[0]}
                size="xl"
                className="ring-4 ring-background shadow-xl"
              />
              {/* Status Dot */}
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full ring-4 ring-background ${
                user.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                    {currentUser?.id === user.id && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        {t('me')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">{user.email}</p>
                </div>
                {(canAssignRole || canChangePassword || canUpdateUser) && (
                  <div className="flex gap-2 shrink-0">
                    {canAssignRole && (
                      <Button
                        variant="outline"
                        onClick={() => setShowRoleDialog(true)}
                        className="gap-2"
                      >
                        <UserCog className="h-4 w-4" />
                        {t('assignRole')}
                      </Button>
                    )}
                    {canChangePassword && (
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordDialog(true)}
                        className="gap-2"
                      >
                        <Key className="h-4 w-4" />
                        {t('changePassword')}
                      </Button>
                    )}
                    {canUpdateUser && (
                      <Button
                        onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {tCommon('edit')}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  className={
                    user.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                  }
                >
                  <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                    user.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`} />
                  {user.status === 'active' ? t('active') : t('inactive')}
                </Badge>

                {user.roles && user.roles.length > 0 && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Shield className="h-3 w-3" />
                    {getRoleDisplayName(user.roles[0], userRole)}
                  </Badge>
                )}

                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t('since')} {new Date(user.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Card */}
        <Card className="hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t('email')}</p>
                <p className="font-medium text-sm truncate">{user.email || t('noEmail')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('mobile')}</p>
                <p className="font-medium text-sm" dir="ltr">{user.mobile}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Names Card */}
        <Card className="hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-base">{t('accountDetails')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('nameEnglish')}</p>
              <p className="font-medium text-sm">{user.name_en}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('nameArabic')}</p>
              <p className="font-medium text-sm">{user.name_ar}</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card className="hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <CardTitle className="text-base">{t('activityInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('lastActive')}</p>
              <p className="font-medium text-sm">
                {user.last_active
                  ? new Date(user.last_active).toLocaleString(locale)
                  : t('never')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('createdAt')}</p>
              <p className="font-medium text-sm">
                {new Date(user.created_at).toLocaleString(locale)}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Timeline / Dates */}
      <div className="flex items-center justify-center gap-8 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{t('createdAt')}: {new Date(user.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{tCommon('lastUpdated')}: {new Date(user.updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>
              {t('changePasswordDesc', { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_password">{t('newPassword')} *</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordFormData.password}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isChangingPassword}
                placeholder={t('enterNewPassword')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">{t('confirmPassword')} *</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={isChangingPassword}
                placeholder={t('confirmNewPassword')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isChangingPassword}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
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
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('assignRole')}</DialogTitle>
            <DialogDescription>
              {t('assignRoleDesc', { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">{t('role')} *</Label>
              <Select
                value={selectedRoleId?.toString() || ''}
                onValueChange={(value) => setSelectedRoleId(Number(value))}
                disabled={isAssigningRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {getRoleDisplayName(role.name, role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={isAssigningRole}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAssignRole} disabled={isAssigningRole || !selectedRoleId}>
              {isAssigningRole ? (
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
