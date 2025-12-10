"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Warehouse,
  Phone,
  MapPin,
  Edit,
  Calendar,
  ExternalLink,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import {
  fetchInventory,
  type Inventory
} from "@/lib/services/inventories";
import { LocationPicker } from "@/components/ui/location-picker";

export default function ViewInventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const inventoryId = parseInt(params.id as string);

  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<Inventory | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true);
      try {
        const fetchedInventory = await fetchInventory(inventoryId);
        setInventory(fetchedInventory);
      } catch {
        toast.error(t('errorLoadingInventories'));
        router.push('/dashboard/inventory');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadInventory();
    }
  }, [inventoryId, t, router, hasPermission]);

  if (hasPermission === null || hasPermission === false || isLoading || !inventory) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = locale === 'ar' && inventory.name_ar 
    ? inventory.name_ar 
    : inventory.name_en || inventory.name || t('unnamedInventory');

  const latitude = typeof inventory.latitude === 'string' 
    ? parseFloat(inventory.latitude) 
    : inventory.latitude;
  const longitude = typeof inventory.longitude === 'string' 
    ? parseFloat(inventory.longitude) 
    : inventory.longitude;

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/inventory')}
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
            {/* Icon */}
            <div className="relative">
              <div className="h-28 w-28 rounded-2xl bg-background shadow-xl ring-4 ring-background overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Warehouse className="h-12 w-12 text-primary" />
                </div>
              </div>
              {/* Status Dot */}
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full ring-4 ring-background ${
                inventory.status === 'active' || inventory.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                  {inventory.code && (
                    <p className="text-muted-foreground mt-1 font-mono text-sm">{inventory.code}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => router.push(`/dashboard/inventory/${inventory.id}/edit`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {tCommon('edit')}
                  </Button>
                </div>
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  inventory.status === 'active' || inventory.is_active
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    inventory.status === 'active' || inventory.is_active ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`} />
                  {inventory.status === 'active' || inventory.is_active ? t('active') : t('inactive')}
                </div>

                {inventory.city && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {locale === 'ar' ? inventory.city.name_ar : inventory.city.name_en}
                  </div>
                )}

                {inventory.created_at && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {tCommon('createdOn')} {new Date(inventory.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Contact Card */}
        {inventory.phone && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="font-semibold">{t('phone')}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('phone')}</p>
                  <p className="font-medium text-sm" dir="ltr">{inventory.phone}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="font-semibold">{t('location')}</h3>
          </div>

          <div className="space-y-2">
            {inventory.full_address && (
              <p className="text-sm">{inventory.full_address}</p>
            )}
            {inventory.address && (
              <p className="text-sm">{inventory.address}</p>
            )}
            {(inventory.city || inventory.governorate) && (
              <p className="text-xs text-muted-foreground">
                {inventory.city && (locale === 'ar' ? inventory.city.name_ar : inventory.city.name_en)}
                {inventory.city && inventory.governorate && ', '}
                {inventory.governorate && (locale === 'ar' ? inventory.governorate.name_ar : inventory.governorate.name_en)}
              </p>
            )}
          </div>

          {latitude && longitude && (
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {t('openInGoogleMaps')}
            </a>
          )}
        </div>

        {/* Code Card */}
        {inventory.code && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Hash className="h-4 w-4 text-violet-500" />
              </div>
              <h3 className="font-semibold">{t('code')}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('inventoryCode')}</p>
                  <p className="font-medium text-sm font-mono">{inventory.code}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Card - Spans 2 columns */}
        {latitude && longitude && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-colors md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="font-semibold">{t('coordinates')}</h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {latitude}, {longitude}
              </p>
            </div>

            <div className="rounded-xl overflow-hidden">
              <LocationPicker
                latitude={latitude.toString()}
                longitude={longitude.toString()}
                onLocationChange={() => {}}
                disabled={true}
                height="200px"
              />
            </div>
          </div>
        )}

      </div>

      {/* Timeline / Dates */}
      {(inventory.created_at || inventory.updated_at) && (
        <div className="flex items-center justify-center gap-8 pt-4 text-xs text-muted-foreground">
          {inventory.created_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{tCommon('createdOn')}: {new Date(inventory.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
          {inventory.created_at && inventory.updated_at && (
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          )}
          {inventory.updated_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{tCommon('lastUpdated')}: {new Date(inventory.updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

