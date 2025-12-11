"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CreditCard, FileText, ShoppingCart, Plus, Trash2, Truck, User, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { validateEgyptianMobile, validateRequired } from "@/lib/validations";
import { createOrder, type OrderItem, type CreateOrderRequest } from "@/lib/services/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateOrderPage() {
  const t = useTranslations('orderCreate');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  const hasPermission = usePagePermission({ requiredPermissions: [PERMISSIONS.CREATE_ORDER] });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{ order_number: string } | null>(null);
  const successBannerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    vendor_notes: '',
    internal_notes: '',
    payment_method: 'cod',
    shipping_cost: 70, // Fixed shipping cost for Cairo/Giza
    customer: {
      name: '',
      mobile: '',
      address: '',
    },
  });
  const [items, setItems] = useState<OrderItem[]>([
    { product_name: '', quantity: 1, price: 0, unit_price: 0 }
  ]);

  // Calculate subtotal from items
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * (item.price || item.unit_price || 0)), 0);
  }, [items]);

  // Calculate total amount
  // If payment method is "paid", total is only shipping cost
  // Otherwise, total is subtotal + shipping cost
  const totalAmount = useMemo(() => {
    if (formData.payment_method === 'paid') {
      return formData.shipping_cost || 0;
    }
    return subtotal + (formData.shipping_cost || 0);
  }, [subtotal, formData.shipping_cost, formData.payment_method]);

  // Scroll to success banner when it appears
  useEffect(() => {
    if (lastCreatedOrder && successBannerRef.current) {
      // Small delay to ensure banner is fully rendered
      setTimeout(() => {
        if (successBannerRef.current) {
          const headerHeight = 64; // h-16 = 64px (sticky header)
          const elementTop = successBannerRef.current.getBoundingClientRect().top;
          const offsetPosition = elementTop + window.pageYOffset - headerHeight - 20; // 20px extra padding
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [lastCreatedOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Scroll to top of page when create button is pressed
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsSubmitting(true);

    try {
      // Validate customer fields
      if (!validateRequired(formData.customer.name || '').isValid) {
        toast.error(t('customerNameRequired'));
        setIsSubmitting(false);
        return;
      }

      // Validate customer mobile (Egyptian format)
      const mobileValidation = validateEgyptianMobile(formData.customer.mobile || '');
      if (!mobileValidation.isValid) {
        toast.error(tValidation(mobileValidation.message || 'mobileInvalid'));
        setIsSubmitting(false);
        return;
      }

      if (!validateRequired(formData.customer.address || '').isValid) {
        toast.error(t('customerAddressRequired'));
        setIsSubmitting(false);
        return;
      }

      // Validate items - price is always required
      const validItems = items.filter(item => {
        const hasName = item.product_name?.trim();
        const hasQuantity = item.quantity > 0;
        const hasPrice = (item.price || item.unit_price) > 0; // Price must be greater than 0
        
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

      // Transform items to use unit_price for backend
      const transformedItems = validItems.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
      }));

      const orderData: CreateOrderRequest = {
        ...formData,
        customer: formData.customer,
        items: transformedItems,
        subtotal: subtotal,
        total_amount: totalAmount,
        shipping_cost: formData.shipping_cost || 0,
      };

      // Internal notes are now allowed for anyone who can create orders

      // Don't include vendor_id - backend will automatically associate with vendor user's vendor
      const createdOrder = await createOrder(orderData);
      
      // Set success state with order number
      setLastCreatedOrder({ order_number: createdOrder.order_number });
      
      toast.success(t('orderCreatedSuccess'), {
        description: `${t('orderNumber')}: ${createdOrder.order_number}`,
      });

      // Reset form for creating another order
      setFormData({
        vendor_notes: '',
        internal_notes: '',
        payment_method: 'cod',
        shipping_cost: 70,
        customer: {
          name: '',
          mobile: '',
          address: '',
        },
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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setItems(prev => {
      const newItems = [...prev];
      let processedValue: string | number;
      if (field === 'quantity' || field === 'price' || field === 'unit_price') {
        processedValue = Number(value) || 0;
      } else {
        processedValue = value;
      }
      newItems[index] = {
        ...newItems[index],
        [field]: processedValue,
        // Keep both price and unit_price in sync for frontend calculation
        ...(field === 'price' ? { unit_price: processedValue as number } : {}),
        ...(field === 'unit_price' ? { price: processedValue as number } : {}),
      };
      return newItems;
    });
  };

  const handleCustomerChange = (field: keyof typeof formData.customer, value: string) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">{t('customerName')} *</Label>
                <Input
                  id="customer_name"
                  placeholder={t('customerNamePlaceholder')}
                  value={formData.customer.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_mobile">{t('customerMobile')} *</Label>
                <Input
                  id="customer_mobile"
                  placeholder={t('customerMobilePlaceholder')}
                  value={formData.customer.mobile}
                  onChange={(e) => handleCustomerChange('mobile', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_address">{t('customerAddress')} *</Label>
              <textarea
                id="customer_address"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('customerAddressPlaceholder')}
                value={formData.customer.address}
                onChange={(e) => handleCustomerChange('address', e.target.value)}
                required
              />
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
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor={`product_name_${index}`} className="text-xs">{t('productName')}</Label>
                    <Input
                      id={`product_name_${index}`}
                      placeholder={t('productNamePlaceholder')}
                      value={item.product_name || ''}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-2">
                    <Label htmlFor={`quantity_${index}`} className="text-xs">{t('quantity')}</Label>
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
                  <div className="col-span-6 md:col-span-3 space-y-2">
                    <Label htmlFor={`price_${index}`} className="text-xs">
                      {t('pricePerUnit')} ({tCommon('egpSymbol')})
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
                  <div className="col-span-12 md:col-span-2 flex items-end gap-2">
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment & Shipping */}
        <div className="grid gap-6 md:grid-cols-2">
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

          {/* Shipping Cost */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle>{t('shippingCost')}</CardTitle>
                  <CardDescription>{t('shippingCostDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">{t('shippingCost')}</Label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{tCommon('egpSymbol')}</span>
                  <Input
                    id="shipping_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping_cost}
                    readOnly
                    className="ps-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('shippingCostFixed')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.payment_method !== 'paid' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium">{tCommon('egpSymbol')} {subtotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('shippingCost')}</span>
              <span className="font-medium">{tCommon('egpSymbol')} {(formData.shipping_cost || 0).toFixed(2)}</span>
            </div>
            {formData.payment_method === 'paid' && (
              <div className="text-xs text-muted-foreground italic">
                {t('paidOrderNote')}
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
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
            <div className="space-y-2">
              <Label htmlFor="internal_notes">{t('internalNotes')}</Label>
              <textarea
                id="internal_notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('internalNotesPlaceholder')}
                value={formData.internal_notes}
                onChange={(e) => handleInputChange('internal_notes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('internalNotesHelp')}</p>
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

