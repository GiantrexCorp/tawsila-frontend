"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Loader2, CheckCircle, Plus, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchOrders, acceptOrder, rejectOrder, type Order } from "@/lib/services/orders";
import { fetchInventories, fetchCurrentInventory, type Inventory } from "@/lib/services/inventories";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function OrdersPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const currentUser = getCurrentUser();
  const isVendor = currentUser?.roles?.includes('vendor');
  
  // Check if user has permission to access orders page
  // Orders management is for super-admin, inventory-manager, and vendors (view-only)
  const hasPermission = usePagePermission(['super-admin', 'inventory-manager', 'vendor']);

  // Fetch orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await fetchOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
        toast.error(t('errorLoadingOrders'));
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadOrders();
    }
  }, [hasPermission, t]);

  const loadInventories = async () => {
    setIsLoadingInventories(true);
    try {
      // Try to get current user's inventory first
      try {
        const currentInventory = await fetchCurrentInventory();
        setInventories([currentInventory]);
        setSelectedInventoryId(currentInventory.id);
      } catch (error) {
        // If /inventories/me doesn't exist, fetch all inventories
        const allInventories = await fetchInventories();
        setInventories(allInventories);
        if (allInventories.length > 0) {
          setSelectedInventoryId(allInventories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load inventories:', error);
      toast.error(t('errorLoadingInventories'));
    } finally {
      setIsLoadingInventories(false);
    }
  };

  const handleAcceptClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowAcceptDialog(true);
    loadInventories();
  };

  const handleRejectClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowRejectDialog(true);
    setRejectionReason("");
  };

  const handleRejectOrder = async () => {
    if (!selectedOrderId) return;

    setRejectingOrderId(selectedOrderId);
    try {
      const updatedOrder = await rejectOrder(selectedOrderId, rejectionReason.trim() || undefined);
      // Update the order in the list
      setOrders(prev => prev.map(order => 
        order.id === selectedOrderId ? updatedOrder : order
      ));
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedOrderId(null);
      toast.success(t('orderRejectedSuccess'));
    } catch (error) {
      console.error('Failed to reject order:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : error instanceof Error 
          ? error.message 
          : tCommon('tryAgain');
      toast.error(t('orderRejectedFailed'), {
        description: errorMessage,
      });
    } finally {
      setRejectingOrderId(null);
    }
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrderId || !selectedInventoryId) {
      toast.error(t('inventoryRequired'));
      return;
    }

    setAcceptingOrderId(selectedOrderId);
    try {
      const updatedOrder = await acceptOrder(selectedOrderId, selectedInventoryId);
      // Update the order in the list
      setOrders(prev => prev.map(order => 
        order.id === selectedOrderId ? updatedOrder : order
      ));
      setShowAcceptDialog(false);
      toast.success(t('orderAcceptedSuccess'));
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error(t('orderAcceptedFailed'), {
        description: error instanceof Error ? error.message : tCommon('tryAgain'),
      });
    } finally {
      setAcceptingOrderId(null);
    }
  };

  // Don't render page if permission check hasn't completed or user lacks permission
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

  // Filter orders by search query
  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order as any).customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: t('pending') },
      accepted: { variant: "outline", label: t('accepted') },
      confirmed: { variant: "outline", label: t('confirmed') },
      picked_up: { variant: "default", label: t('picked_up') },
      in_transit: { variant: "default", label: t('in_transit') },
      delivered: { variant: "outline", label: t('delivered') },
      rejected: { variant: "destructive", label: t('rejected') },
    };

    const { variant, label } = config[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filterByStatus = (status?: string) => {
    if (!status) return filteredOrders;
    return filteredOrders.filter(order => order.status === status);
  };

  const OrdersList = ({ ordersList }: { ordersList: Order[] }) => {
    if (ordersList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noOrders')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('noOrdersDesc')}</p>
          {isVendor && (
            <Button onClick={() => router.push('/dashboard/orders/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('createOrder')}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ordersList.map((order) => {
          const customer = (order as any).customer || {};
          const canAccept = order.status === 'pending' && !isVendor;
          const canReject = order.status === 'pending' && !isVendor;
          
          return (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-sm md:text-base">{order.order_number}</h3>
                      {getStatusBadge(order.status)}
                      {order.payment_method && (
                        <Badge variant="outline" className="text-xs">
                          {order.payment_method === 'cod' ? t('cashOnDelivery') : t('paid')}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {customer.name && (
                        <div>
                          <p className="text-muted-foreground">{t('customer')}</p>
                          <p className="font-medium">{customer.name}</p>
                          {customer.mobile && (
                            <p className="text-xs text-muted-foreground">{customer.mobile}</p>
                          )}
                        </div>
                      )}
                      {(customer.full_address || customer.address) && (
                        <div>
                          <p className="text-muted-foreground">{t('deliveryAddress')}</p>
                          <p className="font-medium text-sm">{customer.full_address || customer.address}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div>
                        <span className="text-muted-foreground">{t('total')}: </span>
                        <span className="font-semibold">{tCommon('egpSymbol')} {order.total_amount.toFixed(2)}</span>
                      </div>
                      {order.subtotal > 0 && (
                        <div>
                          <span className="text-muted-foreground">{t('subtotal')}: </span>
                          <span className="font-medium">{tCommon('egpSymbol')} {order.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">{t('shippingCost')}: </span>
                        <span className="font-medium">{tCommon('egpSymbol')} {order.shipping_cost.toFixed(2)}</span>
                      </div>
                    </div>
                    {order.vendor_notes && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <span className="font-medium">{t('vendorNotes')}: </span>
                        {order.vendor_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canAccept && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleAcceptClick(order.id)}
                        disabled={acceptingOrderId === order.id}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {t('acceptOrder')}
                      </Button>
                    )}
                    {canReject && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRejectClick(order.id)}
                        disabled={rejectingOrderId === order.id}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        {t('rejectOrder')}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t('viewDetails')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
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
        {isVendor && (
          <Button
            onClick={() => router.push('/dashboard/orders/new')}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('createOrder')}
          </Button>
        )}
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
        <Button variant="outline" className="w-full sm:w-auto gap-2">
          <Filter className="h-4 w-4" />
          {t('filters')}
        </Button>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('allOrders')} ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="pending">{t('pending')} ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="accepted">{t('accepted')} ({filterByStatus('accepted').length})</TabsTrigger>
          <TabsTrigger value="in_transit">{t('in_transit')} ({filterByStatus('in_transit').length})</TabsTrigger>
          <TabsTrigger value="delivered">{t('delivered')} ({filterByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OrdersList ordersList={filteredOrders} />
        </TabsContent>

        <TabsContent value="pending">
          <OrdersList ordersList={filterByStatus('pending')} />
        </TabsContent>

        <TabsContent value="accepted">
          <OrdersList ordersList={filterByStatus('accepted')} />
        </TabsContent>

        <TabsContent value="in_transit">
          <OrdersList ordersList={filterByStatus('in_transit')} />
        </TabsContent>

        <TabsContent value="delivered">
          <OrdersList ordersList={filterByStatus('delivered')} />
        </TabsContent>
      </Tabs>

      {/* Reject Order Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectOrder')}</DialogTitle>
            <DialogDescription>{t('rejectOrderDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">{t('rejectionReason')} ({t('optional')})</Label>
              <Textarea
                id="rejection_reason"
                placeholder={t('rejectionReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{t('rejectionReasonHelp')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={rejectingOrderId !== null}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectOrder}
              disabled={rejectingOrderId !== null}
              className="gap-2"
            >
              {rejectingOrderId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {t('rejectOrder')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Order Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('acceptOrder')}</DialogTitle>
            <DialogDescription>{t('acceptOrderDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventory">{t('selectInventory')} *</Label>
              {isLoadingInventories ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <Select
                  value={selectedInventoryId?.toString() || ''}
                  onValueChange={(value) => setSelectedInventoryId(parseInt(value))}
                >
                  <SelectTrigger id="inventory">
                    <SelectValue placeholder={t('selectInventoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventories.map((inventory) => (
                      <SelectItem key={inventory.id} value={inventory.id.toString()}>
                        {inventory.name_en || inventory.name_ar || inventory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {inventories.length === 0 && !isLoadingInventories && (
                <p className="text-xs text-destructive">{t('noInventoriesAvailable')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={acceptingOrderId !== null}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleAcceptOrder}
              disabled={acceptingOrderId !== null || !selectedInventoryId || isLoadingInventories}
              className="gap-2"
            >
              {acceptingOrderId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('accepting')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t('acceptOrder')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

