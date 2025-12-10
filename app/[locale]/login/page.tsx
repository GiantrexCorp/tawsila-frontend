"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { login } from "@/lib/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field when user types (only if it exists)
    if (errors[id]) {
      setErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  // Extracted error handling logic
  const handleLoginError = useCallback((error: unknown) => {
    // Handle inactive account error
    if (error && typeof error === 'object' && 'message' in error && (error as {message: string}).message === 'ACCOUNT_INACTIVE') {
      toast.error(t('accountInactive'), {
        description: t('accountInactiveDesc'),
        duration: 5000,
      });
      return;
    }
    
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
      : t('checkCredentials');
    
    toast.error(t('loginFailed'), {
      description: errorMessage,
    });
  }, [t]);

  // Reusable login handler
  const performLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await login({ email, password });
      
      // Check if password change is required (status_code 203)
      if (response.requires_password_change) {
        toast.info(t('passwordChangeRequired'), {
          description: t('passwordChangeRequiredDesc'),
        });
        router.push('/set-password');
        return;
      }

      // Normal login flow (status_code 200)
      if (response.data) {
        const userName = response.data.name_en || response.data.name_ar || response.data.email;
        
        toast.success(t('loginSuccess'), {
          description: t('welcomeBack', { name: userName }),
        });

        // Redirect based on role
        if (response.data.roles?.includes('shipping-agent')) {
          router.push('/dashboard/orders');
        } else if (response.data.roles?.includes('vendor')) {
          router.push('/dashboard/vendor/profile');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: unknown) {
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  }, [router, t, handleLoginError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.email, formData.password);
  };


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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('welcome')}</CardTitle>
            <CardDescription>
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  autoFocus
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link href="#" className="text-sm text-primary hover:underline">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('passwordPlaceholder')}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>
            
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tawsila. {t('allRightsReserved')}.</p>
        </div>
      </footer>
    </div>
  );
}