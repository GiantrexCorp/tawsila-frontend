"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, Calendar, Shield, Loader2, User as UserIcon } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { changeOwnPassword, User, getRoleDisplayName } from "@/lib/services/users";
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

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tUsers = useTranslations('users');
  const locale = useLocale();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const getDisplayName = () => {
    if (!user) return '';
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  const getRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return tUsers('noRole');
    return getRoleDisplayName(user.roles[0], locale);
  };

  // Memoized handlers for password change
  const handlePasswordInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordFormData(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const handleConfirmPasswordInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  const handleChangePassword = async () => {
    if (!user) return;

    // Validation
    if (!passwordFormData.password) {
      toast.error(tUsers('passwordRequired'));
      return;
    }

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      toast.error(tUsers('passwordMismatch'));
      return;
    }

    if (passwordFormData.password.length < 6) {
      toast.error(tUsers('passwordTooShort'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeOwnPassword(
        passwordFormData.password,
        passwordFormData.confirmPassword
      );

      toast.success(tUsers('passwordChangeSuccess'));
      toast.info(tUsers('ownPasswordChanged'), {
        description: tUsers('pleaseLoginAgain'),
      });
      
      setShowPasswordDialog(false);
      
      // Logout and redirect after password change
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMessages = Object.values((error as {errors: Record<string, string[]>}).errors).flat().join(', ');
        toast.error(tUsers('passwordChangeFailed'), {
          description: errorMessages,
        });
      } else {
        toast.error(tUsers('passwordChangeFailed'), {
          description: (error && typeof error === 'object' && 'message' in error ? (error as {message: string}).message : null) || tCommon('tryAgain'),
        });
      }
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserAvatar
                userId={user.id}
                name={getDisplayName()}
                role={user.roles?.[0]?.name}
                size="xl"
              />
            </div>
            <CardTitle>{getDisplayName()}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Shield className="h-4 w-4" />
              {getRoleDisplay()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tUsers('status')}</span>
              <Badge className={user.status === 'active' 
                ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
              }>
                {tUsers(user.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm pt-4 border-t">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('memberSince')}</p>
                <p>{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{tUsers('lastActive')}</p>
                <p>{user.last_active ? new Date(user.last_active).toLocaleString() : tUsers('never')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('personalInfo')}</CardTitle>
            <CardDescription>{t('personalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name English */}
            <div className="grid gap-2">
              <Label>{tUsers('nameEnglish')}</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>{user.name_en}</span>
              </div>
            </div>

            {/* Name Arabic */}
            <div className="grid gap-2">
              <Label>{tUsers('nameArabic')}</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>{user.name_ar}</span>
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label>{tUsers('email')}</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Mobile */}
            <div className="grid gap-2">
              <Label>{tUsers('mobile')}</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.mobile}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('security')}</CardTitle>
          <CardDescription>{t('securityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('password')}</p>
              <p className="text-sm text-muted-foreground">{t('passwordDesc')}</p>
            </div>
            <Button onClick={() => setShowPasswordDialog(true)}>
              {tUsers('changePassword')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tUsers('changePassword')}</DialogTitle>
            <DialogDescription>
              {t('changePasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* New Password */}
            <div className="grid gap-2">
              <Label htmlFor="new_password">{tUsers('newPassword')} *</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordFormData.password}
                onChange={handlePasswordInputChange}
                disabled={isChangingPassword}
                placeholder={tUsers('enterNewPassword')}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirm_new_password">{tUsers('confirmPassword')} *</Label>
              <Input
                id="confirm_new_password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={handleConfirmPasswordInputChange}
                disabled={isChangingPassword}
                placeholder={tUsers('confirmNewPassword')}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={isChangingPassword}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {tUsers('changingPassword')}
                </>
              ) : (
                tUsers('changePassword')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

