"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { setPassword, getToken } from "@/lib/auth";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('setPassword');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [formData, setFormData] = useState({
    new_password: "",
    new_password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user has a token (required for set-password)
  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error(t('noTokenError'));
      router.push('/login');
    } else {
      setHasToken(true);
    }
  }, [router, t]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, new_password: e.target.value }));
    if (errors.new_password) {
      setErrors((prev) => {
        const { new_password: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors.new_password]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, new_password_confirmation: e.target.value }));
    if (errors.new_password_confirmation) {
      setErrors((prev) => {
        const { new_password_confirmation: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors.new_password_confirmation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    if (!formData.new_password) {
      setErrors({ new_password: t('passwordRequired') });
      setIsLoading(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setErrors({ new_password: t('passwordTooShort') });
      setIsLoading(false);
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setErrors({ new_password_confirmation: t('passwordMismatch') });
      setIsLoading(false);
      return;
    }

    try {
      const response = await setPassword({
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });

      // Get user name based on locale
      const userName = locale === 'ar' ? response.data.name_ar : response.data.name_en;

      toast.success(t('passwordChangeSuccess'), {
        description: t('welcomeMessage', { name: userName }),
      });

      // Redirect based on role
      if (response.data.roles?.includes('shipping-agent')) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error("Set password error:", error);

      // Handle validation errors
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorObj = error as { errors?: Record<string, string[]> };
        if (errorObj.errors) {
          const formattedErrors: Record<string, string> = {};
          Object.entries(errorObj.errors).forEach(([key, messages]) => {
            formattedErrors[key] = messages[0];
          });
          setErrors(formattedErrors);
        }
      }

      // Show error toast
      const errorMessage = (error && typeof error === 'object' && 'message' in error)
        ? String(error.message)
        : t('passwordChangeFailed');

      toast.error(t('passwordChangeFailed'), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render form until we confirm token exists
  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <TawsilaLogo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Set Password Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">{t('newPassword')}</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder={t('enterNewPassword')}
                  value={formData.new_password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  required
                  className={errors.new_password ? "border-red-500" : ""}
                />
                {errors.new_password && (
                  <p className="text-sm text-red-500">{errors.new_password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password_confirmation">{t('confirmPassword')}</Label>
                <Input
                  id="new_password_confirmation"
                  type="password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={formData.new_password_confirmation}
                  onChange={handleConfirmPasswordChange}
                  disabled={isLoading}
                  required
                  className={errors.new_password_confirmation ? "border-red-500" : ""}
                />
                {errors.new_password_confirmation && (
                  <p className="text-sm text-red-500">{errors.new_password_confirmation}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('passwordHint')}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ms-1 me-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('settingPassword')}
                  </>
                ) : (
                  t('setPassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tawsila. {tCommon('allRightsReserved')}.</p>
        </div>
      </footer>
    </div>
  );
}
