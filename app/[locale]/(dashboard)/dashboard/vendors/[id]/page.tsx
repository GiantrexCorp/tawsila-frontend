"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Key, 
  Copy, 
  Edit,
  CheckCircle2,
  XCircle,
  Briefcase,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { 
  fetchVendor,
  type Vendor 
} from "@/lib/services/vendors";
import { Separator } from "@/components/ui/separator";
import { LocationPicker } from "@/components/ui/location-picker";

export default function ViewVendorPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const vendorId = parseInt(params.id as string);
  
  // Check if user has permission
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  const [isLoading, setIsLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  // Load vendor data on mount
  useEffect(() => {
    const loadVendor = async () => {
      setIsLoading(true);
      try {
        const fetchedVendor = await fetchVendor(vendorId);
        setVendor(fetchedVendor);
      } catch (error) {
        console.error('Failed to load vendor:', error);
        toast.error(t('errorLoadingVendor'));
        router.push('/dashboard/vendors');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadVendor();
    }
  }, [vendorId, t, router, hasPermission]);

  const copySecretKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t('secretKeyCopied'));
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/vendors')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t('viewVendor')}</h1>
        </div>
      </div>

      {/* Banner and Logo Section */}
      <Card className="overflow-hidden !p-0 !gap-0">
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden w-full">
          {vendor.cover_image ? (
            <Image
              src={vendor.cover_image}
              alt={`${displayName} cover`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={vendor.status === 'active' ? 'default' : 'secondary'}
              className={`${
                vendor.status === 'active' 
                  ? 'bg-green-500/90 hover:bg-green-500 text-white border-0' 
                  : 'bg-muted-foreground/80 text-white border-0'
              } shadow-md text-xs px-2 py-0.5`}
            >
              {vendor.status === 'active' ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
            </Badge>
          </div>

          {/* Logo */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-xl bg-background border-4 border-background shadow-lg flex items-center justify-center p-3">
                {vendor.logo ? (
                  <Image
                    src={vendor.logo}
                    alt={`${displayName} logo`}
                    width={72}
                    height={72}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-lg">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="pt-10 pb-4 px-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{displayDescription}</p>
            </div>
            <Button 
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}/edit`)} 
              size="sm"
              className="flex-shrink-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              {tCommon('edit')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 max-w-7xl">
        {/* Basic Information */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">{t('basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 px-4 flex-1">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{t('nameEn')}</Label>
              <p className="font-medium text-sm">{vendor.name_en}</p>
            </div>
            <Separator className="my-1.5" />
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{t('nameAr')}</Label>
              <p className="font-medium text-sm">{vendor.name_ar}</p>
            </div>
            <Separator className="my-1.5" />
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{t('status')}</Label>
              <Badge 
                variant={vendor.status === 'active' ? 'default' : 'secondary'}
                className={`text-xs px-2 py-0.5 ${
                  vendor.status === 'active'
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                {vendor.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
              </Badge>
            </div>
            <Separator className="my-1.5" />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground mb-0.5 block">{t('createdOn')}</Label>
                  <p className="font-medium text-sm">
                    {new Date(vendor.created_at).toLocaleDateString(locale, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground mb-0.5 block">{tCommon('lastUpdated')}</Label>
                  <p className="font-medium text-sm">
                    {new Date(vendor.updated_at).toLocaleDateString(locale, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">{t('contactInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 px-4 flex-1">
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1 block">{t('contactPerson')}</Label>
                <p className="font-medium text-sm">{vendor.contact_person}</p>
              </div>
            </div>
            {vendor.email && (
              <>
                <Separator className="my-1.5" />
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('email')}</Label>
                    <p className="font-medium text-sm break-all">{vendor.email}</p>
                  </div>
                </div>
              </>
            )}
            <Separator className="my-1.5" />
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1 block">{t('mobile')}</Label>
                <p className="font-medium text-sm">{vendor.mobile}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">{t('businessInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 px-4 flex-1">
            {vendor.commercial_registration && (
              <>
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('commercialRegistration')}</Label>
                    <p className="font-medium text-sm">{vendor.commercial_registration}</p>
                  </div>
                </div>
                {vendor.tax_number && <Separator className="my-1.5" />}
              </>
            )}
            {vendor.tax_number && (
              <>
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('taxNumber')}</Label>
                    <p className="font-medium text-sm">{vendor.tax_number}</p>
                  </div>
                </div>
                <Separator className="my-1.5" />
              </>
            )}
            {/* Security Settings */}
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-md bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Key className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">{t('secretKey')}</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copySecretKey(vendor.secret_key)}
                    className="h-6 text-xs px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {t('copyKey')}
                  </Button>
                </div>
                <div className="bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
                  <code className="text-xs font-mono text-foreground select-all">
                    {'•'.repeat(24)}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('secretKeyHelp')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">{t('locationInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-3 px-4 flex-1">
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1 block">{t('address')}</Label>
                <p className="font-medium text-sm">{vendor.address}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? vendor.city.name_ar : vendor.city.name_en}, {locale === 'ar' ? vendor.governorate.name_ar : vendor.governorate.name_en}
                </p>
              </div>
            </div>
            {(vendor.latitude || vendor.longitude) && (
              <>
                <Separator className="my-1.5" />
                <div>
                  <LocationPicker
                    latitude={vendor.latitude}
                    longitude={vendor.longitude}
                    onLocationChange={() => {}} // No-op for read-only
                    disabled={true}
                    height="180px"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

