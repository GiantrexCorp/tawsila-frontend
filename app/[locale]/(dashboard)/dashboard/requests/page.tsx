"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { productRequests } from "@/lib/mock-data";
import { usePagePermission } from "@/hooks/use-page-permission";

export default function RequestsPage() {
  const t = useTranslations('requests');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  
  // Check if user has permission to access requests page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager', 'order-preparer']);

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filterByStatus = (status?: string) => {
    if (!status) return productRequests;
    return productRequests.filter(req => req.status === status);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: typeof AlertCircle }> = {
      pending: { variant: "secondary", icon: AlertCircle },
      approved: { variant: "outline", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      partially_accepted: { variant: "default", icon: CheckCircle },
    };

    const { variant, icon: Icon } = config[status] || { variant: "outline", icon: AlertCircle };
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {t(status)}
      </Badge>
    );
  };

  const calculateTotalValue = (products: typeof productRequests[0]['products']) => {
    return products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const RequestCard = ({ request }: { request: typeof productRequests[0] }) => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{request.id}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('organization')}: {request.organizationName}
              </p>
            </div>
            {getStatusBadge(request.status)}
          </div>

          {/* Products List */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">{t('products')} ({request.products.length})</p>
            {request.products.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? product.productNameAr : product.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('quantity')}: {product.quantity} × {product.price} {tCommon('egp')}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {product.quantity * product.price} {tCommon('egp')}
                </p>
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
            <div>
              <p className="text-muted-foreground">{t('requestedOn')}</p>
              <p className="font-medium">{request.requestedAt.toLocaleDateString()}</p>
            </div>
            {request.reviewedAt && (
              <div>
                <p className="text-muted-foreground">{t('reviewedOn')}</p>
                <p className="font-medium">{request.reviewedAt.toLocaleDateString()}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-muted-foreground">{t('totalValue')}</p>
              <p className="text-lg font-semibold">
                {calculateTotalValue(request.products).toLocaleString()} {tCommon('egp')}
              </p>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">{t('notes')}</p>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button variant="default" size="sm" className="flex-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('approve')}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                {t('partialAccept')}
              </Button>
              <Button variant="destructive" size="sm" className="flex-1">
                <XCircle className="h-4 w-4 mr-1" />
                {t('reject')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs by Status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('allRequests')} ({productRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">{t('pending')} ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="approved">{t('approved')} ({filterByStatus('approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">{t('rejected')} ({filterByStatus('rejected').length})</TabsTrigger>
          <TabsTrigger value="partially_accepted">{t('partially_accepted')} ({filterByStatus('partially_accepted').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {productRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filterByStatus('pending').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filterByStatus('approved').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {filterByStatus('rejected').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>

        <TabsContent value="partially_accepted" className="space-y-4">
          {filterByStatus('partially_accepted').map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
