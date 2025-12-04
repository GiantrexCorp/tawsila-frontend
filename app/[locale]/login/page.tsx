"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field when user types
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const user = await login(formData);
      
      toast.success(t('loginSuccess'), {
        description: t('welcomeBack', { name: user.name }),
      });

      // Redirect based on role
      if (user.roles?.includes('shipping-agent')) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle validation errors
      if (error.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          formattedErrors[key] = (messages as string[])[0];
        });
        setErrors(formattedErrors);
      }
      
      // Show error toast
      toast.error(t('loginFailed'), {
        description: error.message || t('checkCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    setFormData({
      email: "moay@gmail.com",
      password: "password",
    });
    
    setIsLoading(true);
    setErrors({});

    try {
      const user = await login({
        email: "moay@gmail.com",
        password: "password",
      });
      
      toast.success(t('loginSuccess'), {
        description: t('welcomeBack', { name: user.name }),
      });

      // Redirect based on role
      if (user.roles?.includes('shipping-agent')) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          formattedErrors[key] = (messages as string[])[0];
        });
        setErrors(formattedErrors);
      }
      
      toast.error(t('loginFailed'), {
        description: error.message || t('checkCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInventoryManagerLogin = async () => {
    setFormData({
      email: "ahmedeid@gmail.com",
      password: "87654321",
    });
    
    setIsLoading(true);
    setErrors({});

    try {
      const user = await login({
        email: "ahmedeid@gmail.com",
        password: "87654321",
      });
      
      toast.success(t('loginSuccess'), {
        description: t('welcomeBack', { name: user.name }),
      });

      // Redirect based on role
      if (user.roles?.includes('shipping-agent')) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          formattedErrors[key] = (messages as string[])[0];
        });
        setErrors(formattedErrors);
      }
      
      toast.error(t('loginFailed'), {
        description: error.message || t('checkCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShippingAgentLogin = async () => {
    setFormData({
      email: "uncleahmed@gmail.com",
      password: "password",
    });
    
    setIsLoading(true);
    setErrors({});

    try {
      const user = await login({
        email: "uncleahmed@gmail.com",
        password: "password",
      });
      
      toast.success(t('loginSuccess'), {
        description: t('welcomeBack', { name: user.name }),
      });

      // Redirect based on role
      if (user.roles?.includes('shipping-agent')) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          formattedErrors[key] = (messages as string[])[0];
        });
        setErrors(formattedErrors);
      }
      
      toast.error(t('loginFailed'), {
        description: error.message || t('checkCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
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
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ms-1 me-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>
            
            {/* Test Login Buttons */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100"
                onClick={handleSuperAdminLogin}
                disabled={isLoading}
              >
                👑 Super Admin Login
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                onClick={handleInventoryManagerLogin}
                disabled={isLoading}
              >
                📦 Inventory Manager Login
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-300 dark:border-green-800 text-green-900 dark:text-green-100"
                onClick={handleShippingAgentLogin}
                disabled={isLoading}
              >
                🚚 Shipping Agent Login
              </Button>
            </div>
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