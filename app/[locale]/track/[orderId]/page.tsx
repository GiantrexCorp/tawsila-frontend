"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Phone, 
  Star, 
  Package, 
  CheckCircle,
  Truck,
  Clock,
  User,
} from "lucide-react";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { orders, agents } from "@/lib/mock-data";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default function TrackOrderPage({ params }: Props) {
  const { orderId } = use(params);
  const t = useTranslations('tracking');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');

  // Find order by order number (orderId is the order number)
  const order = orders.find(o => o.orderNumber === orderId || o.id === orderId);
  const agent = order?.assignedAgent ? agents.find(a => a.id === order.assignedAgent) : null;

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <TawsilaLogo />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t('orderNotFound')}</CardTitle>
              <CardDescription>
                {t('orderNotFoundDesc')}: {orderId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.history.back()}>
                {t('goBack')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: tOrders('pending'), icon: Package },
    { key: 'confirmed', label: tOrders('confirmed'), icon: CheckCircle },
    { key: 'picked_up', label: tOrders('picked_up'), icon: Truck },
    { key: 'in_transit', label: tOrders('in_transit'), icon: Truck },
    { key: 'delivered', label: tOrders('delivered'), icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <TawsilaLogo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl md:text-2xl">{order.orderNumber}</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm">
                    {t('orderedOn')} {order.createdAt.toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2">
                  {tOrders(order.status)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">{t('orderStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between relative overflow-x-auto pb-2">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-muted">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Status Steps */}
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 min-w-[60px]">
                      <div
                        className={`
                          h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors
                          ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                          ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                        `}
                      >
                        <StepIcon className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <span className={`text-[10px] md:text-xs text-center ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('orderDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{tOrders('customer')}</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tOrders('deliveryAddress')}</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{order.deliveryAddress}</p>
                  </div>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('estimatedDelivery')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {order.estimatedDelivery.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('totalAmount')}</span>
                    <span>{order.totalAmount} {tCommon('egp')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Agent */}
            {agent && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('deliveryAgent')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{agent.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">{agent.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({agent.totalDeliveries} deliveries)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.phone}</span>
                    </div>
                    {agent.currentLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Currently on the way</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orderItems')} ({order.products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Product #{product.productId}</p>
                        <p className="text-sm text-muted-foreground">{tOrders('quantity')}: {product.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">{product.price} {tCommon('egp')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tawsila. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
