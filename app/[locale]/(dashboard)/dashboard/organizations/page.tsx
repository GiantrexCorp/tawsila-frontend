"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { BackendImage } from "@/components/ui/backend-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Key, User, FileText, Calendar, Plus, Copy, MoreVertical, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchVendors, type Vendor } from "@/lib/services/vendors";

export default function OrganizationsPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  // Check if user has permission to access vendors page
  const hasPermission = usePagePermission({ requiredPermissions: [] });

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
        <Button className="w-full sm:w-auto" onClick={() => router.push('/dashboard/organizations/new')}>
          <Plus className="h-4 w-4 me-2" />
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
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                      {vendor.logo ? (
                        <BackendImage
                          src={vendor.logo}
                          alt={locale === 'ar' ? vendor.name_ar : vendor.name_en}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {locale === 'ar' ? vendor.name_ar : vendor.name_en}
                      </CardTitle>
                      <Badge variant={vendor.status === 'active' ? 'outline' : 'secondary'} className="mt-1">
                        {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>{tCommon('edit')}</DropdownMenuItem>
                      <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">{tCommon('delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">
                    {locale === 'ar' ? vendor.description_ar : vendor.description_en}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{vendor.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{vendor.mobile}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{vendor.address}</span>
                  </div>
                  <div className="text-sm text-muted-foreground ms-6">
                    {locale === 'ar' ? vendor.city.name_ar : vendor.city.name_en},{' '}
                    {locale === 'ar' ? vendor.governorate.name_ar : vendor.governorate.name_en}
                  </div>
                  {(vendor.latitude || vendor.longitude) && (
                    <div className="text-xs text-muted-foreground ms-6">
                      {t('coordinates')}: {vendor.latitude}, {vendor.longitude}
                    </div>
                  )}
                </div>

                {/* Business Info */}
                {(vendor.commercial_registration || vendor.tax_number) && (
                  <div className="space-y-2 pt-2 border-t">
                    {vendor.commercial_registration && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('commercialRegistration')}: </span>
                        <span className="font-medium">{vendor.commercial_registration}</span>
                      </div>
                    )}
                    {vendor.tax_number && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('taxNumber')}: </span>
                        <span className="font-medium">{vendor.tax_number}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Secret Key */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('secretKey')}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => vendor.secret_key && copySecretKey(vendor.secret_key)}
                      disabled={!vendor.secret_key}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-muted/50 px-3 py-2 rounded-md">
                    <code className="text-xs font-mono">{'*'.repeat(12)}</code>
                  </div>
                </div>

                {/* Created Date */}
                <div className="pt-2 border-t flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t('createdOn')}: {new Date(vendor.created_at).toLocaleDateString(locale)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
