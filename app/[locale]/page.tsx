"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Shield, Search, ArrowRight, ChevronUp, Youtube, Facebook, Linkedin, Instagram, Zap, Globe } from "lucide-react";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LandingPage() {
  const t = useTranslations('landing');
  const app = useTranslations('app');
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleTrack = () => {
    if (orderNumber.trim()) {
      router.push(`/track/${orderNumber.trim()}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trackingBenefits = [
    {
      icon: Zap,
      title: t('realTimeTracking'),
      description: t('realTimeTrackingDesc'),
    },
    {
      icon: MapPin,
      title: t('estimatedDelivery'),
      description: t('estimatedDeliveryDesc'),
    },
    {
      icon: Shield,
      title: t('secureTracking'),
      description: t('secureTrackingDesc'),
    },
    {
      icon: Globe,
      title: t('deliveryUpdates'),
      description: t('deliveryUpdatesDesc'),
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

      {/* Hero Section - Order Tracking Focus */}
      <section className="flex-1 bg-gradient-to-b from-background via-primary/5 to-muted/20 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Main Heading */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {t('heroTitle')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                {t('heroSubtitle')}
              </p>
            </div>

            {/* Tracking Search Box - Simplified & Cool */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-2xl"></div>
              <Card className="relative border-2 shadow-2xl bg-card/95 backdrop-blur">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder={t('trackingPlaceholder')}
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                        className="text-base md:text-lg h-14 md:h-16 pl-12 pr-4 border-2 placeholder:text-sm md:placeholder:text-base"
                      />
                    </div>
                    <Button 
                      onClick={handleTrack} 
                      size="lg" 
                      className="h-14 md:h-16 px-10 text-lg md:text-xl shadow-lg hover:shadow-xl transition-all"
                      disabled={!orderNumber.trim()}
                    >
                      {t('trackNow')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Track with Tawsila */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-muted/20 via-muted/30 to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 md:mb-4">
              {t('whyTrackTitle')}
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('whyTrackSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {trackingBenefits.map((benefit, index) => (
              <Card key={index} className="border">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {benefit.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 via-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('trustedByTitle')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('trustedBySubtitle')}
            </p>
          </div>

          {/* Company Logos Grid - Bigger Cards with Images */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto mb-16">
            {[
              { name: "TechCorp", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=200&fit=crop" },
              { name: "GlobalTrade", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop" },
              { name: "FastShip", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=200&fit=crop" },
              { name: "LogiMax", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop" },
            ].map((company, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 bg-card hover:border-primary transition-all duration-300 hover:shadow-lg"
              >
                <div className="aspect-video relative bg-muted/50 overflow-hidden">
                  <img
                    src={company.image}
                    alt={company.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent group-hover:from-background/95 group-hover:via-background/40 transition-all duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-center text-muted-foreground group-hover:text-primary transition-colors duration-300">
                    {company.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border hover:border-primary/50 hover:shadow-md transition-all">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm md:text-base text-muted-foreground">Active Clients</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:border-primary/50 hover:shadow-md transition-all">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm md:text-base text-muted-foreground">Deliveries/Month</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:border-primary/50 hover:shadow-md transition-all">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm md:text-base text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border hover:border-primary/50 hover:shadow-md transition-all">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm md:text-base text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-muted/30 via-muted/40 to-muted/30 relative">
        <div className="container mx-auto px-4 py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Logo Section - Left */}
            <div className="flex flex-col">
              <TawsilaLogo />
            </div>

            {/* Legal Links - Center */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('legalNotice')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('termsOfUse')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('privacyNotice')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('contact')}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('cookieSettings')}
              </Link>
            </div>

            {/* Social Media - Right */}
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-sm font-semibold mb-3 text-foreground">{t('followUs')}</h3>
              <div className="flex items-center gap-4">
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright - Centered */}
          <div className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
        )}
      </footer>
    </div>
  );
}
