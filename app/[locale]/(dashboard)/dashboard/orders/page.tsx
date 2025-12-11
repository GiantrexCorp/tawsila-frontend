"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Loader2, CheckCircle, Plus, XCircle } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchOrders, acceptOrder, rejectOrder, type Order, type Customer } from "@/lib/services/orders";
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
  const isShippingAgent = currentUser?.roles?.includes('shipping-agent');

  // Check if user has permission to access orders page
  // Allow access if user has ANY order-related permission
  const hasPermission = usePagePermission({
    requiredPermissions: [
      PERMISSIONS.LIST_ORDERS,
      PERMISSIONS.CREATE_ORDER,
      PERMISSIONS.ACCEPT_ORDER,
      PERMISSIONS.SCAN_ORDER_INVENTORY,
      PERMISSIONS.SCAN_ORDER_DELIVERY,
      PERMISSIONS.ASSIGN_PICKUP_AGENT,
      PERMISSIONS.ASSIGN_DELIVERY_AGENT,
      PERMISSIONS.PICKUP_ORDER_FROM_VENDOR,
      PERMISSIONS.PICKUP_ORDER_FROM_INVENTORY,
      PERMISSIONS.VERIFY_ORDER_OTP,
    ]
  });

  // Permission checks for specific actions
  const { hasPermission: canCreateOrder } = useHasPermission(PERMISSIONS.CREATE_ORDER);
  const { hasPermission: canAcceptOrder } = useHasPermission(PERMISSIONS.ACCEPT_ORDER);

  // Fetch orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        // Backend automatically filters orders for shipping agents
        // So we can use the same fetchOrders() function for all roles
        const fetchedOrders = await fetchOrders();
        // Sort orders from old to new (ascending by created_at)
        const sortedOrders = fetchedOrders.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB; // Oldest first
        });
        setOrders(sortedOrders);
      } catch {
        toast.error(t('errorLoadingOrders'));
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadOrders();
    }
  }, [hasPermission, t]);

  const loadInventories = useCallback(async () => {
    setIsLoadingInventories(true);
    try {
      // Try to get current user's inventory first
      try {
        const currentInventory = await fetchCurrentInventory();
        setInventories([currentInventory]);
        setSelectedInventoryId(currentInventory.id);
      } catch {
        // If /inventories/me doesn't exist, fetch all inventories
        const allInventories = await fetchInventories();
        setInventories(allInventories);
        if (allInventories.length > 0) {
          setSelectedInventoryId(allInventories[0].id);
        }
      }
    } catch {
      toast.error(t('errorLoadingInventories'));
    } finally {
      setIsLoadingInventories(false);
    }
  }, [t]);

  const handleAcceptClick = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setShowAcceptDialog(true);
    loadInventories();
  }, [loadInventories]);

  const handleRejectClick = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setShowRejectDialog(true);
    setRejectionReason("");
  }, []);

  const handleRejectOrder = useCallback(async () => {
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
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('orderRejectedFailed'), { description: message });
    } finally {
      setRejectingOrderId(null);
    }
  }, [selectedOrderId, rejectionReason, t, tCommon]);

  const handleAcceptOrder = useCallback(async () => {
    if (!selectedOrderId || !selectedInventoryId) {
      toast.error(t('inventoryRequired'));
      return;
    }

    setAcceptingOrderId(selectedOrderId);
    try {
      const updatedOrder = await acceptOrder(selectedOrderId, selectedInventoryId);
      setOrders(prev => prev.map(order =>
        order.id === selectedOrderId ? updatedOrder : order
      ));
      setShowAcceptDialog(false);
      toast.success(t('orderAcceptedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('orderAcceptedFailed'), { description: message });
    } finally {
      setAcceptingOrderId(null);
    }
  }, [selectedOrderId, selectedInventoryId, t, tCommon]);

  // Memoize filtered orders to avoid recalculating on every render
  // Must be before early returns to comply with React hooks rules
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.order_number.toLowerCase().includes(query) ||
      order.customer?.name?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  // Status mapping for grouping related statuses
  const statusMap = useMemo(() => ({
    'pending': ['pending', 'created'],
    'accepted': ['accepted', 'confirmed'],
    'pickup_assigned': ['assigned', 'pickup_assigned'],
    'picked_up': ['picked_up'],
    'in_transit': ['in_transit', 'in_transit_to_hub'],
    'at_hub': ['arrived_at_hub', 'at_hub'],
    'delivery_assigned': ['out_for_delivery_assignment'],
    'out_for_delivery': ['out_for_delivery'],
    'delivered': ['delivered'],
    'failed_delivery': ['delivery_failed', 'delivery_attempt_failed'],
  }), []);

  // Memoize filterByStatus function
  const filterByStatus = useCallback((status?: string) => {
    if (!status) return filteredOrders;
    const statuses = statusMap[status as keyof typeof statusMap] || [status];
    return filteredOrders.filter(order => statuses.includes(order.status));
  }, [filteredOrders, statusMap]);

  // Memoize status counts to avoid recalculating on every render
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(statusMap).forEach(status => {
      const statuses = statusMap[status as keyof typeof statusMap];
      counts[status] = filteredOrders.filter(order => statuses.includes(order.status)).length;
    });
    return counts;
  }, [filteredOrders, statusMap]);

  const getStatusCount = useCallback((status: string): number => {
    return statusCounts[status] || 0;
  }, [statusCounts]);

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

  const OrdersList = ({ ordersList }: { ordersList: Order[] }) => {
    if (ordersList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isShippingAgent ? t('noAssignedOrders') : t('noOrders')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isShippingAgent ? t('noAssignedOrdersDesc') : t('noOrdersDesc')}
          </p>
          {canCreateOrder && (
            <Button onClick={() => router.push('/dashboard/orders/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('createOrder')}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ordersList.map((order) => {
          const customer: Customer = order.customer || { name: '', mobile: '', address: '' };
          const canAccept = order.status === 'pending' && canAcceptOrder;
          const canReject = order.status === 'pending' && canAcceptOrder;

          return (
            <div
              key={order.id}
              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              className="group relative cursor-pointer"
            >
              {/* Card Container */}
              <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-300 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                {/* Gradient Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge - Floating */}
                <div className="absolute top-3 end-3 z-10">
                  <OrderStatusBadge status={order.status} statusLabel={order.status_label} />
                </div>

                {/* Main Content */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Order Icon */}
                    <div className="relative flex-shrink-0">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">#</span>
                      </div>
                    </div>

                    {/* Order Number & Payment */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                        {order.order_number}
                      </h3>
                      {order.payment_method && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 mt-1.5">
                          {order.payment_method === 'cod' ? t('cashOnDelivery') : t('paid')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {customer.name && (
                  <div className="px-5 pb-3">
                    <p className="text-sm font-medium truncate">{customer.name}</p>
                    {customer.mobile && (
                      <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{customer.mobile}</p>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div className="px-5 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-sm font-semibold text-foreground">
                    {tCommon('egpSymbol')} {order.total_amount.toFixed(2)}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="px-5 pb-4 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {canAccept && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAcceptClick(order.id)}
                          disabled={acceptingOrderId === order.id}
                          className="h-7 text-xs px-2"
                        >
                          <CheckCircle className="h-3.5 w-3.5 me-1" />
                          {t('accept')}
                        </Button>
                      )}
                      {canReject && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectClick(order.id)}
                          disabled={rejectingOrderId === order.id}
                          className="h-7 text-xs px-2"
                        >
                          <XCircle className="h-3.5 w-3.5 me-1" />
                          {t('reject')}
                        </Button>
                      )}
                      {!canAccept && !canReject && (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          {t('viewDetails')}
                        </span>
                      )}
                    </div>
                    {/* Arrow Icon */}
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                      <Eye className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isShippingAgent ? t('myAssignedOrders') : t('title')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {isShippingAgent ? t('myAssignedOrdersDesc') : t('subtitle')}
          </p>
        </div>
        {canCreateOrder && (
          <Button
            onClick={() => router.push('/dashboard/orders/new')}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('createOrder')}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1 overflow-x-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">{t('allOrders')} ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">{t('pending')} ({getStatusCount('pending')})</TabsTrigger>
          <TabsTrigger value="accepted" className="text-xs sm:text-sm">{t('accepted')} ({getStatusCount('accepted')})</TabsTrigger>
          <TabsTrigger value="pickup_assigned" className="text-xs sm:text-sm">{t('pickupAssigned')} ({getStatusCount('pickup_assigned')})</TabsTrigger>
          <TabsTrigger value="picked_up" className="text-xs sm:text-sm">{t('pickedUp')} ({getStatusCount('picked_up')})</TabsTrigger>
          <TabsTrigger value="in_transit" className="text-xs sm:text-sm">{t('inTransit')} ({getStatusCount('in_transit')})</TabsTrigger>
          <TabsTrigger value="at_hub" className="text-xs sm:text-sm">{t('atHub')} ({getStatusCount('at_hub')})</TabsTrigger>
          <TabsTrigger value="delivery_assigned" className="text-xs sm:text-sm">{t('deliveryAssigned')} ({getStatusCount('delivery_assigned')})</TabsTrigger>
          <TabsTrigger value="out_for_delivery" className="text-xs sm:text-sm">{t('outForDelivery')} ({getStatusCount('out_for_delivery')})</TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs sm:text-sm">{t('delivered')} ({getStatusCount('delivered')})</TabsTrigger>
          <TabsTrigger value="failed_delivery" className="text-xs sm:text-sm">{t('failedDelivery')} ({getStatusCount('failed_delivery')})</TabsTrigger>
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

        <TabsContent value="pickup_assigned">
          <OrdersList ordersList={filterByStatus('pickup_assigned')} />
        </TabsContent>

        <TabsContent value="picked_up">
          <OrdersList ordersList={filterByStatus('picked_up')} />
        </TabsContent>

        <TabsContent value="in_transit">
          <OrdersList ordersList={filterByStatus('in_transit')} />
        </TabsContent>

        <TabsContent value="at_hub">
          <OrdersList ordersList={filterByStatus('at_hub')} />
        </TabsContent>

        <TabsContent value="delivery_assigned">
          <OrdersList ordersList={filterByStatus('delivery_assigned')} />
        </TabsContent>

        <TabsContent value="out_for_delivery">
          <OrdersList ordersList={filterByStatus('out_for_delivery')} />
        </TabsContent>

        <TabsContent value="delivered">
          <OrdersList ordersList={filterByStatus('delivered')} />
        </TabsContent>

        <TabsContent value="failed_delivery">
          <OrdersList ordersList={filterByStatus('failed_delivery')} />
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

