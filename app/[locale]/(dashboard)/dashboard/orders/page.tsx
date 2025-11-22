"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye } from "lucide-react";
import { orders } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrdersPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: t('pending') },
      confirmed: { variant: "outline", label: t('confirmed') },
      picked_up: { variant: "default", label: t('picked_up') },
      in_transit: { variant: "default", label: t('in_transit') },
      delivered: { variant: "outline", label: t('delivered') },
    };

    const { variant, label } = config[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filterByStatus = (status?: string) => {
    if (!status) return filteredOrders;
    return filteredOrders.filter(order => order.status === status);
  };

  const OrdersList = ({ orders }: { orders: typeof filteredOrders }) => (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm md:text-base">{order.orderNumber}</h3>
                  {getStatusBadge(order.status)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('customer')}</p>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('deliveryAddress')}</p>
                    <p className="font-medium text-sm">{order.deliveryAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('total')}: </span>
                    <span className="font-semibold">{order.totalAmount} {tCommon('egp')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('items')}: </span>
                    <span className="font-medium">{order.products.length}</span>
                  </div>
                  {order.assignedAgent && (
                    <div>
                      <span className="text-muted-foreground">{t('agent')}: </span>
                      <span className="font-medium">{order.assignedAgent}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                {t('viewDetails')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          {t('filters')}
        </Button>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('allOrders')} ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="pending">{t('pending')} ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="in_transit">{t('in_transit')} ({filterByStatus('in_transit').length})</TabsTrigger>
          <TabsTrigger value="delivered">{t('delivered')} ({filterByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OrdersList orders={filteredOrders} />
        </TabsContent>

        <TabsContent value="pending">
          <OrdersList orders={filterByStatus('pending')} />
        </TabsContent>

        <TabsContent value="in_transit">
          <OrdersList orders={filterByStatus('in_transit')} />
        </TabsContent>

        <TabsContent value="delivered">
          <OrdersList orders={filterByStatus('delivered')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

