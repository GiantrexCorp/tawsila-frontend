"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ArrowLeft, Loader2, Building2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { createVendor, fetchGovernorates, fetchCities, type Governorate, type City, type CreateVendorRequest } from "@/lib/services/vendors";
import { Separator } from "@/components/ui/separator";
import { LocationPicker } from "@/components/ui/location-picker";

export default function NewVendorPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  const router = useRouter();
  
  // Check if user has permission
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreateVendorRequest>({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
    contact_person: '',
    description_en: '',
    description_ar: '',
    address: '',
    governorate_id: 0,
    city_id: 0,
    latitude: '',
    longitude: '',
    commercial_registration: '',
    tax_number: '',
    status: 'active',
    secret_key: '',
    logo: undefined,
    cover_image: undefined,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Load governorates on mount
  useEffect(() => {
    fetchGovernorates()
      .then(setGovernorates)
      .catch(() => toast.error(t('errorLoadingGovernorates')));
  }, [t]);

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
        // Show error toast only, don't log to console to avoid visual clutter
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

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('fileTooLarge'));
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Store actual file object for upload
      setFormData(prev => ({ ...prev, logo: file }));
    }
  }, [t]);

  const removeLogo = useCallback(() => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo: undefined }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }, []);

  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('fileTooLarge'));
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Store actual file object for upload
      setFormData(prev => ({ ...prev, cover_image: file }));
    }
  }, [t]);

  const removeCover = useCallback(() => {
    setCoverPreview('');
    setFormData(prev => ({ ...prev, cover_image: undefined }));
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  }, []);

  const handleLocationChange = useCallback((lat: string, lng: string) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    // Clear errors for latitude/longitude when location is set
    if (errors.latitude || errors.longitude) {
      setErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { latitude: _lat, longitude: _lng, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate required location fields
    const validationErrors: Record<string, string> = {};
    
    if (!formData.governorate_id || formData.governorate_id === 0) {
      validationErrors.governorate_id = t('selectGovernorate');
    }
    
    if (!formData.city_id || formData.city_id === 0) {
      validationErrors.city_id = t('selectCity');
    }

    if (!formData.latitude || !formData.longitude) {
      validationErrors.latitude = 'Please select a location on the map';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(tCommon('error'), {
        description: 'Please fill in all required fields',
      });
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      // Clean up form data - remove empty optional fields only
      const cleanedData = { ...formData };
      
      // Remove empty optional string fields
      if (!cleanedData.email) delete cleanedData.email;
      if (!cleanedData.commercial_registration) delete cleanedData.commercial_registration;
      if (!cleanedData.tax_number) delete cleanedData.tax_number;
      
      // Only delete logo/cover_image if they are not File objects
      if (!cleanedData.logo || (typeof cleanedData.logo === 'string' && !cleanedData.logo)) {
        delete cleanedData.logo;
      }
      if (!cleanedData.cover_image || (typeof cleanedData.cover_image === 'string' && !cleanedData.cover_image)) {
        delete cleanedData.cover_image;
      }

      await createVendor(cleanedData);
      toast.success(t('vendorCreatedSuccess'));
      router.push('/dashboard/vendors');
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
        : t('errorCreatingVendor');
      
      toast.error(t('createFailed'), {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/vendors')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('addOrganization')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t('addVendorDescription')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Basic Information with Logo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInformation')}</CardTitle>
              <CardDescription>{t('basicInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo & Cover Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                {/* Logo Upload */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="h-32 w-32 rounded-lg border-2 border-muted overflow-hidden bg-muted/30">
                          <Image
                            src={logoPreview}
                            alt="Logo preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          className="absolute -top-2 -right-2"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 flex flex-col items-center justify-center gap-1"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {t('uploadLogo')}
                        </p>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>{t('vendorLogo')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('vendorLogoDesc')} {t('uploadLogoHint')}
                    </p>
                    {!logoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('chooseFile')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cover Photo Upload */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {coverPreview ? (
                      <div className="relative">
                        <div className="h-32 w-32 rounded-lg border-2 border-muted overflow-hidden bg-muted/30">
                          <Image
                            src={coverPreview}
                            alt="Cover preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          className="absolute -top-2 -right-2"
                          onClick={removeCover}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 flex flex-col items-center justify-center gap-1"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {t('uploadCover')}
                        </p>
                      </div>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>{t('coverImage')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('coverImageDesc')} {t('uploadCoverHint')}
                    </p>
                    {!coverPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('chooseFile')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('nameEn')} *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    placeholder="e.g., Adidas"
                    className={errors.name_en ? "border-red-500" : ""}
                  />
                  {errors.name_en && (
                    <p className="text-sm text-red-500">{errors.name_en}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('nameAr')} *</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    placeholder="مثال: اديداس"
                    className={errors.name_ar ? "border-red-500" : ""}
                  />
                  {errors.name_ar && (
                    <p className="text-sm text-red-500">{errors.name_ar}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description_en">{t('descriptionEn')} *</Label>
                  <Input
                    id="description_en"
                    value={formData.description_en}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    placeholder="e.g., Sportswear company"
                    className={errors.description_en ? "border-red-500" : ""}
                  />
                  {errors.description_en && (
                    <p className="text-sm text-red-500">{errors.description_en}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_ar">{t('descriptionAr')} *</Label>
                  <Input
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    placeholder="مثال: شركة ملابس رياضية"
                    className={errors.description_ar ? "border-red-500" : ""}
                  />
                  {errors.description_ar && (
                    <p className="text-sm text-red-500">{errors.description_ar}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('status')} *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('activeOrgs')}</SelectItem>
                    <SelectItem value="inactive">{t('inactiveOrgs')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contactInformation')}</CardTitle>
              <CardDescription>{t('contactInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t('contactPerson')} *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                  placeholder="e.g., John Doe"
                  className={errors.contact_person ? "border-red-500" : ""}
                />
                {errors.contact_person && (
                  <p className="text-sm text-red-500">{errors.contact_person}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="vendor@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">{t('mobile')} *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    placeholder="01XXXXXXXXX"
                    className={errors.mobile ? "border-red-500" : ""}
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-500">{errors.mobile}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('locationInformation')}</CardTitle>
              <CardDescription>{t('locationInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">{t('address')} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                  placeholder="Street, Building, Apartment"
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="governorate_id">{t('governorate')} *</Label>
                  <Select
                    value={formData.governorate_id.toString()}
                    onValueChange={handleGovernorateChange}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger className={errors.governorate_id ? "border-red-500" : ""}>
                      <SelectValue placeholder={t('selectGovernorate')} />
                    </SelectTrigger>
                    <SelectContent>
                      {governorates.map((gov) => (
                        <SelectItem key={gov.id} value={gov.id.toString()}>
                          {gov.name_en} - {gov.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.governorate_id && (
                    <p className="text-sm text-red-500">{errors.governorate_id}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_id">{t('city')} *</Label>
                  <Select
                    value={formData.city_id.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: parseInt(value) }))}
                    disabled={isSubmitting || isLoadingCities || !formData.governorate_id}
                    required
                  >
                    <SelectTrigger className={errors.city_id ? "border-red-500" : ""}>
                      <SelectValue placeholder={isLoadingCities ? tCommon('loading') : t('selectCity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name_en} - {city.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city_id && (
                    <p className="text-sm text-red-500">{errors.city_id}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>{t('selectLocation')} *</Label>
                  <p className="text-sm text-muted-foreground mb-3">{t('selectLocationDesc')}</p>
                  <LocationPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={handleLocationChange}
                    disabled={isSubmitting}
                  />
                  {(errors.latitude || errors.longitude) && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.latitude || errors.longitude}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">{t('latitude')} *</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      readOnly
                      disabled
                      required
                      placeholder="Click on map to set"
                      className={`bg-muted ${errors.latitude ? "border-red-500" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">{t('longitude')} *</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      readOnly
                      disabled
                      required
                      placeholder="Click on map to set"
                      className={`bg-muted ${errors.longitude ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('businessInformation')}</CardTitle>
              <CardDescription>{t('businessInformationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commercial_registration">{t('commercialRegistration')}</Label>
                  <Input
                    id="commercial_registration"
                    value={formData.commercial_registration}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    className={errors.commercial_registration ? "border-red-500" : ""}
                  />
                  {errors.commercial_registration && (
                    <p className="text-sm text-red-500">{errors.commercial_registration}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">{t('taxNumber')}</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    className={errors.tax_number ? "border-red-500" : ""}
                  />
                  {errors.tax_number && (
                    <p className="text-sm text-red-500">{errors.tax_number}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & API Access */}
          <Card>
            <CardHeader>
              <CardTitle>{t('securitySettings')}</CardTitle>
              <CardDescription>{t('securitySettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret_key">{t('secretKey')} *</Label>
                <Input
                  id="secret_key"
                  type="password"
                  value={formData.secret_key}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                  placeholder="Enter secret key for API authentication"
                  className={errors.secret_key ? "border-red-500" : ""}
                />
                {errors.secret_key && (
                  <p className="text-sm text-red-500">{errors.secret_key}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('secretKeyHelp')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/dashboard/vendors')}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('saving')}
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('createVendor')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

