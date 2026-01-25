"use client";

import { use, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  Building2,
  Clock,
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  XCircle,
  Warehouse,
  CircleDot,
} from "lucide-react";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { fetchTracking, type TrackingData, type TrackingStep } from "@/lib/services/tracking";
import { toast } from "sonner";

interface Props {
  params: Promise<{ orderId: string }>;
}

// Icon mapping for tracking steps
const stepIcons: Record<string, React.ElementType> = {
  order_placed: Package,
  order_confirmed: CheckCircle2,
  at_vendor: Building2,
  at_inventory: Warehouse,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

export default function TrackOrderPage({ params }: Props) {
  const { orderId } = use(params);
  const t = useTranslations('tracking');
  const locale = useLocale();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTracking(orderId);
        setTracking(data);
      } catch (err) {
        console.error('Failed to load tracking:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tracking');
      } finally {
        setIsLoading(false);
      }
    };

    loadTracking();
  }, [orderId]);

  const copyTrackingNumber = () => {
    if (tracking) {
      navigator.clipboard.writeText(tracking.track_number);
      toast.success(t('trackingNumberCopied'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">{t('loadingTracking')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('orderNotFound')}</h2>
              <p className="text-muted-foreground mt-2">
                {t('orderNotFoundDesc')}: <span className="font-mono">{orderId}</span>
              </p>
            </div>
            <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('goBack')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedSteps = tracking.tracking_steps.filter(s => s.completed).length;
  const totalSteps = tracking.tracking_steps.length;
  const progressPercent = tracking.current_phase.progress;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6 md:p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  tracking.is_completed
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : tracking.is_failed
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {tracking.is_completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : tracking.is_failed ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  )}
                  {tracking.status_label}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatFullDate(tracking.updated_at)}</span>
                </div>
              </div>

              {/* Tracking Numbers */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {tracking.track_number}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyTrackingNumber}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {t('order')}: <span className="font-mono">{tracking.order_number}</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tracking.current_phase.label}</span>
                  <span className="font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      tracking.is_completed
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : tracking.is_failed
                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                        : 'bg-gradient-to-r from-primary to-primary/80'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stepsCompleted', { completed: completedSteps, total: totalSteps })}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-6">{t('trackingTimeline')}</h2>

            <div className="relative">
              {/* Vertical Line - use start-6 for RTL support */}
              <div className="absolute start-6 top-0 bottom-0 w-0.5 bg-border" />

              {/* Steps */}
              <div className="space-y-1">
                {tracking.tracking_steps.map((step, index) => (
                  <TrackingStepItem
                    key={step.key}
                    step={step}
                    isLast={index === tracking.tracking_steps.length - 1}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Vendor Card */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('vendor')}</p>
                  <p className="font-semibold">{locale === 'ar' ? tracking.vendor.name_ar : tracking.vendor.name_en}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('deliveryAddress')}</p>
                  <p className="font-medium text-sm truncate">{tracking.delivery_address.full_address}</p>
                </div>
              </div>
              {tracking.delivery_address.address_notes && (
                <p className="text-xs text-muted-foreground pl-13">
                  {t('note')}: {tracking.delivery_address.address_notes}
                </p>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-6">{t('statusHistory')}</h2>

            <div className="relative overflow-x-auto">
              <div className="flex gap-4 pb-2 min-w-max">
                {tracking.status_history.map((item, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                  >
                    {/* Connector line */}
                    {index < tracking.status_history.length - 1 && (
                      <div className="absolute top-4 left-1/2 w-full h-0.5 bg-primary/30" style={{ marginLeft: '50%' }} />
                    )}

                    {/* Dot */}
                    <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                      index === tracking.status_history.length - 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      <CircleDot className="h-4 w-4" />
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center w-24">
                      <p className="text-xs font-medium line-clamp-2">{item.status_label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('trackAnother')}
            </Button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}

// Header Component
function Header() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <TawsilaLogo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

// Tracking Step Item Component
function TrackingStepItem({
  step,
  isLast,
  formatDate,
}: {
  step: TrackingStep;
  isLast: boolean;
  formatDate: (date: string) => string;
}) {
  const t = useTranslations('tracking');
  const Icon = stepIcons[step.key] || Package;

  return (
    <div className={`relative flex gap-4 ${!isLast ? 'pb-6' : ''}`}>
      {/* Icon */}
      <div className={`relative z-10 flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
        step.current
          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
          : step.completed
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      }`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
          {step.timestamp && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(step.timestamp)}
            </span>
          )}
        </div>

        {/* Location link */}
        {step.location && step.completed && (
          <a
            href={`https://www.google.com/maps?q=${step.location.latitude},${step.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" />
            {t('viewLocation')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
