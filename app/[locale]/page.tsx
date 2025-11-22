"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, BarChart3, Shield, Zap, Globe } from "lucide-react";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LandingPage() {
  const t = useTranslations('landing');
  const app = useTranslations('app');

  const features = [
    {
      icon: Package,
      title: t('inventoryManagement'),
      description: t('inventoryDesc'),
    },
    {
      icon: Truck,
      title: t('deliveryTracking'),
      description: t('deliveryDesc'),
    },
    {
      icon: BarChart3,
      title: t('analyticsReports'),
      description: t('analyticsDesc'),
    },
    {
      icon: Shield,
      title: t('secureReliable'),
      description: t('secureDesc'),
    },
    {
      icon: Zap,
      title: t('fastEfficient'),
      description: t('fastDesc'),
    },
    {
      icon: Globe,
      title: t('multiLanguage'),
      description: t('multiDesc'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <TawsilaLogo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:flex">
              <Link href="/track">{t('trackOrder')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">{t('login')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {app('tagline')}
              </h1>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <Button size="lg" asChild className="w-full sm:w-auto text-base md:text-lg h-11 md:h-12 px-6 md:px-8">
                <Link href="/dashboard">{t('getStarted')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base md:text-lg h-11 md:h-12 px-6 md:px-8">
                <Link href="/track">{t('trackOrder')}</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12 max-w-2xl mx-auto px-4">
              <div>
                <p className="text-2xl md:text-4xl font-bold text-primary">1000+</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('dailyDeliveries')}</p>
              </div>
              <div>
                <p className="text-2xl md:text-4xl font-bold text-primary">99.9%</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('onTimeRate')}</p>
              </div>
              <div>
                <p className="text-2xl md:text-4xl font-bold text-primary">500+</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('happyClients')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 md:mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <TawsilaLogo />
            <p className="text-sm text-muted-foreground">
              {t('copyright')}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                {t('privacy')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                {t('terms')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                {t('contact')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
