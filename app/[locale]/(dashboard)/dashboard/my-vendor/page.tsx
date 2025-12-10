"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Key,
  Copy,
  Calendar,
  ExternalLink,
  FileText,
  Hash,
  Plus,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import {
  type Vendor,
  fetchCurrentVendor
} from "@/lib/services/vendors";
import { LocationPicker } from "@/components/ui/location-picker";

export default function MyVendorProfilePage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');
  const locale = useLocale();
  const router = useRouter();

  const hasPermission = usePagePermission(['vendor']);

  const [isLoading, setIsLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    const loadVendor = async () => {
      setIsLoading(true);
      try {
        const fetchedVendor = await fetchCurrentVendor();
        setVendor(fetchedVendor);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : tCommon('contactAdmin');
        toast.error(t('errorLoadingVendor'), { description: message });
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadVendor();
    }
  }, [hasPermission, t]);

  const copySecretKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t('secretKeyCopied'));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tCommon('copied'));
  };

  if (hasPermission === null || hasPermission === false || isLoading || !vendor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = locale === 'ar' ? vendor.name_ar : vendor.name_en;
  const displayDescription = locale === 'ar' ? vendor.description_ar : vendor.description_en;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 h-48 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden">
          {vendor.cover_image && (
            <Image
              src={vendor.cover_image}
              alt={displayName}
              fill
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative pt-24 px-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="relative">
              <div className="h-28 w-28 rounded-2xl bg-background shadow-xl ring-4 ring-background overflow-hidden flex items-center justify-center">
                {vendor.logo ? (
                  <Image
                    src={vendor.logo}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
              </div>
              {/* Status Dot */}
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full ring-4 ring-background ${
                vendor.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                  <p className="text-muted-foreground mt-1 max-w-xl">{displayDescription}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => router.push('/dashboard/orders/new')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {tOrders('createOrder')}
                  </Button>
                </div>
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  vendor.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    vendor.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`} />
                  {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
                </div>

                {vendor.city && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {locale === 'ar' ? vendor.city.name_ar : vendor.city.name_en}
                  </div>
                )}

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t('vendorSince')} {new Date(vendor.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Contact Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Phone className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="font-semibold">{t('contactInfo')}</h3>
          </div>

          <div className="space-y-3">
            {vendor.contact_person && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{t('contactPerson')}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{vendor.contact_person}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(vendor.contact_person)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('mobile')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm" dir="ltr">{vendor.mobile}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(vendor.mobile)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {vendor.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('email')}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{vendor.email}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyToClipboard(vendor.email || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="font-semibold">{t('location')}</h3>
          </div>

          <div className="space-y-2">
            <p className="text-sm">{vendor.address}</p>
            {vendor.city && vendor.governorate && (
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? vendor.city.name_ar : vendor.city.name_en}, {locale === 'ar' ? vendor.governorate.name_ar : vendor.governorate.name_en}
              </p>
            )}
          </div>

          {vendor.latitude && vendor.longitude && (
            <a
              href={`https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {tCommon('openInGoogleMaps')}
            </a>
          )}
        </div>

        {/* API Access Card - Only show if secret_key exists */}
        {vendor.secret_key && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-violet-500" />
              </div>
              <h3 className="font-semibold">{t('securitySettings')}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('secretKey')}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg text-xs font-mono">
                    {showSecretKey ? vendor.secret_key : '•'.repeat(32)}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    title={showSecretKey ? tCommon('hideSecretKey') : tCommon('showSecretKey')}
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copySecretKey(vendor.secret_key!)}
                    title={tCommon('copySecretKey')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{t('secretKeyHelp')}</p>
            </div>
          </div>
        )}

        {/* Business Details Card */}
        {(vendor.commercial_registration || vendor.tax_number) && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="font-semibold">{t('businessDetails')}</h3>
            </div>

            <div className="space-y-3">
              {vendor.commercial_registration && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t('commercialRegistration')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{vendor.commercial_registration}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(vendor.commercial_registration || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {vendor.tax_number && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t('taxNumber')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{vendor.tax_number}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(vendor.tax_number || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Card - Spans 2 columns */}
        {vendor.latitude && vendor.longitude && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="font-semibold">{t('coordinates')}</h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {vendor.latitude}, {vendor.longitude}
              </p>
            </div>

            <div className="rounded-xl overflow-hidden">
              <LocationPicker
                latitude={vendor.latitude}
                longitude={vendor.longitude}
                onLocationChange={() => {}}
                disabled={true}
                height="200px"
              />
            </div>
          </div>
        )}

      </div>

      {/* Timeline / Dates */}
      <div className="flex items-center justify-center gap-8 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{t('createdOn')}: {new Date(vendor.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{tCommon('lastUpdated')}: {new Date(vendor.updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}

