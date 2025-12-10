"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Warehouse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchInventory, updateInventory, type UpdateInventoryRequest } from "@/lib/services/inventories";
import { fetchGovernorates, fetchCities, type Governorate, type City } from "@/lib/services/vendors";
import { LocationPicker } from "@/components/ui/location-picker";

export default function EditInventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const inventoryId = parseInt(params.id as string);
  
  // Check if user has permission (only super-admin)
  const hasPermission = usePagePermission(['super-admin']);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<UpdateInventoryRequest>({
    name_en: '',
    name_ar: '',
    phone: '',
    address: '',
    governorate_id: 0,
    city_id: 0,
    latitude: undefined,
    longitude: undefined,
    status: 'active',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Load inventory data and governorates on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventory, govs] = await Promise.all([
          fetchInventory(inventoryId),
          fetchGovernorates()
        ]);

        // Set governorates
        setGovernorates(govs);

        // Set form data from inventory
        // Convert latitude/longitude to numbers if they're strings
        const latitude = typeof inventory.latitude === 'string' 
          ? parseFloat(inventory.latitude) 
          : inventory.latitude;
        const longitude = typeof inventory.longitude === 'string' 
          ? parseFloat(inventory.longitude) 
          : inventory.longitude;

        setFormData({
          name_en: inventory.name_en || '',
          name_ar: inventory.name_ar || '',
          phone: inventory.phone || '',
          address: inventory.address || '',
          governorate_id: inventory.governorate_id || 0,
          city_id: inventory.city_id || 0,
          latitude: !isNaN(latitude as number) ? latitude as number : undefined,
          longitude: !isNaN(longitude as number) ? longitude as number : undefined,
          status: inventory.status || 'active',
        });

        // Load cities if governorate is set
        if (inventory.governorate_id) {
          const fetchedCities = await fetchCities(inventory.governorate_id);
          setCities(fetchedCities);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('errorLoadingInventory');
        toast.error(t('errorLoadingInventory'), { description: message });
        router.push('/dashboard/inventory');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadData();
    }
  }, [inventoryId, hasPermission, t, router]);

  // Load cities when governorate changes
  const handleGovernorateChange = useCallback(async (governorateId: string) => {
    const id = parseInt(governorateId);
    setFormData(prev => ({ ...prev, governorate_id: id, city_id: 0 }));
    setCities([]);
    
    if (id) {
      setIsLoadingCities(true);
      try {
        const fetchedCities = await fetchCities(id);
        setCities(fetchedCities);
      } catch (error) {
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? String(error.message) 
          : t('errorLoadingCities');
        toast.error(t('errorLoadingCities'), {
          description: errorMessage,
        });
      } finally {
        setIsLoadingCities(false);
      }
    }
  }, [t]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  const handleLocationChange = useCallback((lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    setFormData(prev => ({ 
      ...prev, 
      latitude: !isNaN(latNum) ? latNum : undefined, 
      longitude: !isNaN(lngNum) ? lngNum : undefined 
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_en?.trim()) {
      newErrors.name_en = t('nameEnRequired');
    }
    if (!formData.name_ar?.trim()) {
      newErrors.name_ar = t('nameArRequired');
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = t('phoneRequired');
    }
    if (!formData.address?.trim()) {
      newErrors.address = t('addressRequired');
    }
    if (!formData.governorate_id || formData.governorate_id === 0) {
      newErrors.governorate_id = t('governorateRequired');
    }
    if (!formData.city_id || formData.city_id === 0) {
      newErrors.city_id = t('cityRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(tCommon('error'), {
        description: t('pleaseFillRequiredFields'),
      });
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      // Clean up form data - remove undefined fields
      const cleanedData: UpdateInventoryRequest = {
        name_en: formData.name_en?.trim(),
        name_ar: formData.name_ar?.trim(),
        phone: formData.phone?.trim(),
        address: formData.address?.trim(),
        governorate_id: formData.governorate_id,
        city_id: formData.city_id,
        status: formData.status || 'active',
      };

      // Only include coordinates if they are provided and valid numbers
      if (
        formData.latitude !== undefined && 
        formData.longitude !== undefined &&
        !isNaN(formData.latitude) && 
        !isNaN(formData.longitude)
      ) {
        cleanedData.latitude = formData.latitude;
        cleanedData.longitude = formData.longitude;
      }

      await updateInventory(inventoryId, cleanedData);
      toast.success(t('inventoryUpdatedSuccess'));
      router.push('/dashboard/inventory');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorObj = error as { errors?: Record<string, string[]> };
        if (errorObj.errors) {
          const formattedErrors: Record<string, string> = {};
          Object.entries(errorObj.errors).forEach(([key, messages]) => {
            formattedErrors[key] = messages[0];
          });
          setErrors(formattedErrors);
        }
      }
      
      const errorMessage = (error && typeof error === 'object' && 'message' in error) 
        ? String(error.message) 
        : t('errorUpdatingInventory');
      
      toast.error(t('updateFailed'), {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/inventory')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('editInventory')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('editInventoryDesc')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInformation')}</CardTitle>
              <CardDescription>{t('basicInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name (English) */}
              <div className="space-y-2">
                <Label htmlFor="name_en">
                  {t('nameEn')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  placeholder={t('nameEnPlaceholder')}
                  className={errors.name_en ? 'border-destructive' : ''}
                />
                {errors.name_en && (
                  <p className="text-sm text-destructive">{errors.name_en}</p>
                )}
              </div>

              {/* Name (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="name_ar">
                  {t('nameAr')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={handleInputChange}
                  placeholder={t('nameArPlaceholder')}
                  className={errors.name_ar ? 'border-destructive' : ''}
                  dir="rtl"
                />
                {errors.name_ar && (
                  <p className="text-sm text-destructive">{errors.name_ar}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t('phone')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('phonePlaceholder')}
                  className={errors.phone ? 'border-destructive' : ''}
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('locationInformation')}</CardTitle>
              <CardDescription>{t('locationInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  {t('address')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t('addressPlaceholder')}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              {/* Governorate */}
              <div className="space-y-2">
                <Label htmlFor="governorate_id">
                  {t('governorate')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.governorate_id?.toString() || ''}
                  onValueChange={handleGovernorateChange}
                >
                  <SelectTrigger id="governorate_id" className={errors.governorate_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder={t('selectGovernorate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map((governorate) => (
                      <SelectItem key={governorate.id} value={governorate.id.toString()}>
                        {locale === 'ar' ? governorate.name_ar : governorate.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.governorate_id && (
                  <p className="text-sm text-destructive">{errors.governorate_id}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city_id">
                  {t('city')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.city_id?.toString() || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: parseInt(value) }))}
                  disabled={!formData.governorate_id || formData.governorate_id === 0 || isLoadingCities}
                >
                  <SelectTrigger id="city_id" className={errors.city_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isLoadingCities ? t('loadingCities') : t('selectCity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {locale === 'ar' ? city.name_ar : city.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city_id && (
                  <p className="text-sm text-destructive">{errors.city_id}</p>
                )}
              </div>

              {/* Location Picker for Coordinates */}
              <div className="space-y-2">
                <Label>{t('coordinates')} ({t('optional')})</Label>
                <LocationPicker
                  latitude={formData.latitude?.toString() || ''}
                  longitude={formData.longitude?.toString() || ''}
                  onLocationChange={handleLocationChange}
                />
                <p className="text-xs text-muted-foreground">{t('coordinatesDesc')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/inventory')}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                <>
                  <Warehouse className="h-4 w-4" />
                  {t('updateInventory')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}



