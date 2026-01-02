"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CreditCard, FileText, ShoppingCart, Plus, Trash2, User, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { validateEgyptianMobile, validateRequired } from "@/lib/validations";
import { createOrder, type CreateOrderItem, type CreateOrderRequest } from "@/lib/services/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGovernorates, useCities } from "@/hooks/queries/use-vendors";
import { LocationPicker } from "@/components/ui/location-picker";
import { Separator } from "@/components/ui/separator";

interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  address: string;
  address_notes: string;
  governorate_id: string;
  city_id: string;
  latitude: string;
  longitude: string;
}

export default function CreateOrderPage() {
  const t = useTranslations('orderCreate');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.CREATE_ORDER] });

  // Fetch governorates and cities
  const { data: governorates = [] } = useGovernorates();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{ order_number: string } | null>(null);
  const successBannerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    vendor_notes: '',
    payment_method: 'cod',
  });
  const [customer, setCustomer] = useState<CustomerFormData>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    address_notes: '',
    governorate_id: '',
    city_id: '',
    latitude: '',
    longitude: '',
  });

  // Fetch cities based on selected governorate
  const { data: cities = [] } = useCities(customer.governorate_id ? parseInt(customer.governorate_id) : undefined);

  const [items, setItems] = useState<(CreateOrderItem & { price?: number })[]>([
    { product_name: '', quantity: 1, price: 0, unit_price: 0 }
  ]);

  // Calculate subtotal from items
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * (item.price || item.unit_price || 0)), 0);
  }, [items]);

  // Total amount is subtotal (shipping is calculated by backend)
  const totalAmount = subtotal;

  // Scroll to success banner when it appears
  useEffect(() => {
    if (lastCreatedOrder && successBannerRef.current) {
      setTimeout(() => {
        if (successBannerRef.current) {
          const headerHeight = 64;
          const elementTop = successBannerRef.current.getBoundingClientRect().top;
          const offsetPosition = elementTop + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [lastCreatedOrder]);

  // Reset city when governorate changes
  useEffect(() => {
    if (customer.governorate_id) {
      setCustomer(prev => ({ ...prev, city_id: '' }));
    }
  }, [customer.governorate_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSubmitting(true);

    try {
      // Validate customer fields
      if (!validateRequired(customer.name || '').isValid) {
        toast.error(t('customerNameRequired'));
        setIsSubmitting(false);
        return;
      }

      const mobileValidation = validateEgyptianMobile(customer.mobile || '');
      if (!mobileValidation.isValid) {
        toast.error(tValidation(mobileValidation.message || 'mobileInvalid'));
        setIsSubmitting(false);
        return;
      }

      if (!validateRequired(customer.address || '').isValid) {
        toast.error(t('customerAddressRequired'));
        setIsSubmitting(false);
        return;
      }

      // Validate items
      const validItems = items.filter(item => {
        const hasName = item.product_name?.trim();
        const hasQuantity = item.quantity > 0;
        const hasPrice = (item.price || item.unit_price) > 0;
        return hasName && hasQuantity && hasPrice;
      });

      if (validItems.length === 0) {
        toast.error(t('noItemsError'));
        setIsSubmitting(false);
        return;
      }

      if (subtotal <= 0) {
        toast.error(t('invalidSubtotalError'));
        setIsSubmitting(false);
        return;
      }

      // Transform items to match backend expected format
      const transformedItems: CreateOrderItem[] = validItems.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
        product_sku: item.product_sku || null,
        product_description: item.product_description || null,
        weight: item.weight || null,
        notes: item.notes || null,
      }));

      // Build order data matching backend validation rules
      const orderData: CreateOrderRequest = {
        customer: {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          email: customer.email || null,
          address_notes: customer.address_notes || null,
          governorate_id: customer.governorate_id ? parseInt(customer.governorate_id) : null,
          city_id: customer.city_id ? parseInt(customer.city_id) : null,
          latitude: customer.latitude ? parseFloat(customer.latitude) : null,
          longitude: customer.longitude ? parseFloat(customer.longitude) : null,
        },
        items: transformedItems,
        payment_method: formData.payment_method || null,
        vendor_notes: formData.vendor_notes || null,
      };

      const createdOrder = await createOrder(orderData);

      setLastCreatedOrder({ order_number: createdOrder.order_number });

      toast.success(t('orderCreatedSuccess'), {
        description: `${t('orderNumber')}: ${createdOrder.order_number}`,
      });

      // Reset form
      setFormData({
        vendor_notes: '',
        payment_method: 'cod',
      });
      setCustomer({
        name: '',
        mobile: '',
        email: '',
        address: '',
        address_notes: '',
        governorate_id: '',
        city_id: '',
        latitude: '',
        longitude: '',
      });
      setItems([{ product_name: '', quantity: 1, price: 0, unit_price: 0 }]);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(t('orderCreatedFailed'), {
        description: error instanceof Error ? error.message : tCommon('tryAgain'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (field: keyof CustomerFormData, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (lat: string, lng: string) => {
    setCustomer(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleItemChange = (index: number, field: keyof CreateOrderItem | 'price', value: string | number) => {
    setItems(prev => {
      const newItems = [...prev];
      let processedValue: string | number | null;
      if (field === 'quantity' || field === 'price' || field === 'unit_price' || field === 'weight') {
        processedValue = value === '' ? null : Number(value) || 0;
      } else {
        processedValue = value;
      }
      newItems[index] = {
        ...newItems[index],
        [field]: processedValue,
        ...(field === 'price' ? { unit_price: processedValue as number } : {}),
        ...(field === 'unit_price' ? { price: processedValue as number } : {}),
      };
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_name: '', quantity: 1, price: 0, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
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
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Success Banner */}
      {lastCreatedOrder && (
        <Card ref={successBannerRef} className="border-green-500 bg-green-50 dark:bg-green-950/20" id="success-banner">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                  {t('orderCreatedSuccess')}
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {t('orderNumber')}: <span className="font-mono font-bold">{lastCreatedOrder.order_number}</span>
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  {t('orderCreatedSuccessDesc') || 'You can create another order below.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100"
                onClick={() => setLastCreatedOrder(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <CardTitle>{t('customerInformation')}</CardTitle>
                <CardDescription>{t('customerInformationDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name & Mobile */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">{t('customerName')} *</Label>
                <Input
                  id="customer_name"
                  placeholder={t('customerNamePlaceholder')}
                  value={customer.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_mobile">{t('customerMobile')} *</Label>
                <Input
                  id="customer_mobile"
                  placeholder={t('customerMobilePlaceholder')}
                  value={customer.mobile}
                  onChange={(e) => handleCustomerChange('mobile', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="customer_email">{t('customerEmail')}</Label>
              <Input
                id="customer_email"
                type="email"
                placeholder={t('customerEmailPlaceholder')}
                value={customer.email}
                onChange={(e) => handleCustomerChange('email', e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="customer_address">{t('customerAddress')} *</Label>
              <textarea
                id="customer_address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('customerAddressPlaceholder')}
                value={customer.address}
                onChange={(e) => handleCustomerChange('address', e.target.value)}
                required
              />
            </div>

            {/* Address Notes */}
            <div className="space-y-2">
              <Label htmlFor="customer_address_notes">{t('customerAddressNotes')}</Label>
              <Input
                id="customer_address_notes"
                placeholder={t('customerAddressNotesPlaceholder')}
                value={customer.address_notes}
                onChange={(e) => handleCustomerChange('address_notes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('customerAddressNotesHelp')}</p>
            </div>

            {/* Governorate & City */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="governorate">{t('governorate')}</Label>
                <Select
                  value={customer.governorate_id}
                  onValueChange={(value) => handleCustomerChange('governorate_id', value)}
                >
                  <SelectTrigger id="governorate">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('city')}</Label>
                <Select
                  value={customer.city_id}
                  onValueChange={(value) => handleCustomerChange('city_id', value)}
                  disabled={!customer.governorate_id}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t('selectCity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name_en} - {city.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Location Picker */}
            <div className="space-y-4">
              <div>
                <Label>{t('deliveryLocation')}</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('deliveryLocationDesc') || 'Select the delivery location on the map, search for a location, or enter coordinates manually'}
                </p>
                <LocationPicker
                  latitude={customer.latitude}
                  longitude={customer.longitude}
                  onLocationChange={handleLocationChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Latitude & Longitude */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">{t('latitude')}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="e.g., 30.0444"
                    value={customer.latitude}
                    onChange={(e) => handleCustomerChange('latitude', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter manually or click/drag on map
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">{t('longitude')}</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="e.g., 31.2357"
                    value={customer.longitude}
                    onChange={(e) => handleCustomerChange('longitude', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter manually or click/drag on map
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle>{t('orderItems')}</CardTitle>
                  <CardDescription>{t('orderItemsDesc')}</CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  {/* Row 1: Product name, SKU, Quantity, Price */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <Label htmlFor={`product_name_${index}`} className="text-xs">{t('productName')} *</Label>
                      <Input
                        id={`product_name_${index}`}
                        placeholder={t('productNamePlaceholder')}
                        value={item.product_name || ''}
                        onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <Label htmlFor={`product_sku_${index}`} className="text-xs">{t('productSku')}</Label>
                      <Input
                        id={`product_sku_${index}`}
                        placeholder={t('productSkuPlaceholder')}
                        value={item.product_sku || ''}
                        onChange={(e) => handleItemChange(index, 'product_sku', e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <Label htmlFor={`quantity_${index}`} className="text-xs">{t('quantity')} *</Label>
                      <Input
                        id={`quantity_${index}`}
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <Label htmlFor={`price_${index}`} className="text-xs">
                        {t('pricePerUnit')} *
                      </Label>
                      <div className="relative">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{tCommon('egpSymbol')}</span>
                        <Input
                          id={`price_${index}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price || item.unit_price || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleItemChange(index, 'price', val);
                            handleItemChange(index, 'unit_price', val);
                          }}
                          className="ps-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-span-6 md:col-span-2 flex items-end gap-2">
                      <div className="flex-1 text-end">
                        <p className="text-xs text-muted-foreground">{t('itemTotal')}</p>
                        <p className="font-semibold">
                          {tCommon('egpSymbol')} {(item.quantity * (item.price || item.unit_price || 0)).toFixed(2)}
                        </p>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Row 2: Weight, Description, Notes */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <Label htmlFor={`weight_${index}`} className="text-xs">{t('itemWeight')}</Label>
                      <Input
                        id={`weight_${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.weight || ''}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <Label htmlFor={`product_description_${index}`} className="text-xs">{t('productDescription')}</Label>
                      <Input
                        id={`product_description_${index}`}
                        placeholder={t('productDescriptionPlaceholder')}
                        value={item.product_description || ''}
                        onChange={(e) => handleItemChange(index, 'product_description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <Label htmlFor={`item_notes_${index}`} className="text-xs">{t('itemNotes')}</Label>
                      <Input
                        id={`item_notes_${index}`}
                        placeholder={t('itemNotesPlaceholder')}
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle>{t('paymentInformation')}</CardTitle>
                <CardDescription>{t('paymentInformationDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">{t('paymentMethod')}</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder={t('selectPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">{t('cashOnDelivery')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold">{t('totalAmount')}</span>
              <span className="font-bold text-lg">{tCommon('egpSymbol')} {totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <CardTitle>{t('orderNotes')}</CardTitle>
                <CardDescription>{t('orderNotesDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_notes">{t('vendorNotes')}</Label>
              <textarea
                id="vendor_notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('vendorNotesPlaceholder')}
                value={formData.vendor_notes}
                onChange={(e) => handleInputChange('vendor_notes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('vendorNotesHelp')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                {t('createOrder')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
