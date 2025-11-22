"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Truck, CheckCircle } from "lucide-react";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function TrackPage() {
  const t = useTranslations('tracking');
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  const handleTrack = () => {
    if (orderNumber.trim()) {
      router.push(`/track/${orderNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <TawsilaLogo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-8 md:py-12">
        <div className="max-w-2xl w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              {t('enterOrderNumber')}
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="e.g., ORD-2024-001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                  className="text-base md:text-lg h-11 md:h-12"
                />
                <Button onClick={handleTrack} size="lg" className="px-6 md:px-8 w-full sm:w-auto">
                  <Search className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                  {t('search')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How it Works */}
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 pt-6 md:pt-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Enter Order Number</CardTitle>
                <CardDescription>
                  Type your order number or tracking code above
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Track in Real-Time</CardTitle>
                <CardDescription>
                  See your order&apos;s current status and location
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Get Delivery Updates</CardTitle>
                <CardDescription>
                  Receive estimated delivery time and agent info
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Tawsila. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
