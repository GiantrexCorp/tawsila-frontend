"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Loader2, MapPin, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchVendors, type Vendor } from "@/lib/services/vendors";

export default function VendorsPage() {
  const t = useTranslations('organizations');
  const locale = useLocale();
  const router = useRouter();
  
  // Check if user has permission to access vendors page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  // Vendors state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);

  // Load vendors on mount
  useEffect(() => {
    const loadVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const fetchedVendors = await fetchVendors();
        setVendors(fetchedVendors);
      } catch {
        toast.error(t('errorLoadingVendors'));
      } finally {
        setIsLoadingVendors(false);
      }
    };

    loadVendors();
  }, [t]);

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => router.push('/dashboard/vendors/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addOrganization')}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalOrganizations')}</p>
            <p className="text-2xl font-bold">{isLoadingVendors ? '-' : vendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('activeOrgs')}</p>
            <p className="text-2xl font-bold text-green-600">
              {isLoadingVendors ? '-' : vendors.filter(v => v.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('inactiveOrgs')}</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {isLoadingVendors ? '-' : vendors.filter(v => v.status === 'inactive').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Grid */}
      {isLoadingVendors ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t('noVendors')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('noVendorsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
              className="group relative cursor-pointer"
            >
              {/* Card Container with glassmorphism */}
              <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                {/* Gradient Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Status Indicator - Floating pill */}
                <div className="absolute top-3 right-3 z-20">
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                    vendor.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-500/30'
                  }`}>
                    {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
                  </div>
                </div>

                {/* Top Section - Logo & Name */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105">
                        {vendor.logo ? (
                          <Image
                            src={vendor.logo}
                            alt={locale === 'ar' ? vendor.name_ar : vendor.name_en}
                            width={56}
                            height={56}
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Location */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                        {locale === 'ar' ? vendor.name_ar : vendor.name_en}
                      </h3>
                      <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate">
                          {locale === 'ar' ? vendor.city.name_ar : vendor.city.name_en}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 pb-3">
                  <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {locale === 'ar' ? vendor.description_ar : vendor.description_en}
                  </p>
                </div>

                {/* Vendor Since Badge */}
                <div className="px-5 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                    <span className="font-medium">{t('vendorSince')}</span>
                    <span>{new Date(vendor.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="px-5 pb-4 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/60 font-medium">
                      {t('viewDetails')}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                      <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

