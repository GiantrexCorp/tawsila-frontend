"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Key, User, FileText, Calendar, Plus, Copy, Loader2, Edit, CheckCircle2, XCircle, Briefcase, Eye } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchVendors, type Vendor } from "@/lib/services/vendors";

export default function VendorsPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
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
      } catch (error) {
        console.error('Failed to load vendors:', error);
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

  const copySecretKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t('secretKeyCopied'));
  };

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
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <Card 
              key={vendor.id} 
              className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/20 !p-0 !gap-0 cursor-pointer"
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
            >
              {/* Banner */}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden w-full">
                {vendor.cover_image ? (
                  <img 
                    src={vendor.cover_image} 
                    alt={`${locale === 'ar' ? vendor.name_ar : vendor.name_en} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-black/5" />

                {/* Logo Overlay */}
                <div className="absolute -bottom-8 left-4">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-xl bg-background border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
                      {vendor.logo ? (
                        <img 
                          src={vendor.logo} 
                          alt={`${locale === 'ar' ? vendor.name_ar : vendor.name_en} logo`}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="pt-8 pb-4 px-6">
                {/* Vendor Name and Description */}
                <div className="space-y-2 mb-4">
                  <CardTitle className="text-xl font-bold mb-1 line-clamp-1">
                    {locale === 'ar' ? vendor.name_ar : vendor.name_en}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {locale === 'ar' ? vendor.description_ar : vendor.description_en}
                  </p>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground pb-3 border-b">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{t('since')} {new Date(vendor.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{tCommon('lastUpdated')} {new Date(vendor.updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/vendors/${vendor.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('view')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/vendors/${vendor.id}/edit`);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {tCommon('edit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

