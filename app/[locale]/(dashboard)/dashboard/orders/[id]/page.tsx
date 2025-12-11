"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Package,
  User,
  CreditCard,
  FileText,
  Calendar,
  Printer,
  XCircle,
  Truck,
  UserPlus
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { fetchOrder, acceptOrder, rejectOrder, assignPickupAgent, fetchOrderAssignments, type Order, type OrderItem, type Customer, type Assignment } from "@/lib/services/orders";
import { fetchInventories, fetchCurrentInventory, type Inventory } from "@/lib/services/inventories";
import { fetchActiveAgents, type Agent } from "@/lib/services/agents";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
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
import { QRCodeSVG } from "qrcode.react";

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const tApp = useTranslations('app');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  const currentUser = getCurrentUser();
  const isVendor = currentUser?.roles?.includes('vendor');

  // Check if user has permission to access order detail page
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
  const { hasPermission: canAcceptOrderPerm } = useHasPermission(PERMISSIONS.ACCEPT_ORDER);
  const { hasPermission: canAssignPickupAgentPerm } = useHasPermission(PERMISSIONS.ASSIGN_PICKUP_AGENT);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || isNaN(orderId)) {
        toast.error(t('errorLoadingOrder'), {
          description: tCommon('invalidOrderId'),
        });
        router.push('/dashboard/orders');
        return;
      }

      setIsLoading(true);
      try {
        const [fetchedOrder, fetchedAssignments] = await Promise.all([
          fetchOrder(orderId),
          fetchOrderAssignments(orderId)
        ]);
        setOrder(fetchedOrder);
        setAssignments(fetchedAssignments);
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon('tryAgain');
        toast.error(t('errorLoadingOrder'), { description: message });
        router.push('/dashboard/orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadOrder();
    }
  }, [orderId, hasPermission, t, tCommon, router]);

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

  const handleAcceptClick = useCallback(() => {
    setShowAcceptDialog(true);
    loadInventories();
  }, [loadInventories]);

  const handleRejectClick = useCallback(() => {
    setShowRejectDialog(true);
    setRejectionReason("");
  }, []);

  const handleRejectOrder = useCallback(async () => {
    setIsRejecting(true);
    try {
      const updatedOrder = await rejectOrder(orderId, rejectionReason.trim() || undefined);
      setOrder(updatedOrder);
      setShowRejectDialog(false);
      setRejectionReason("");
      toast.success(t('orderRejectedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('orderRejectedFailed'), { description: message });
    } finally {
      setIsRejecting(false);
    }
  }, [orderId, rejectionReason, t, tCommon]);

  const loadAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const fetchedAgents = await fetchActiveAgents();
      setAgents(fetchedAgents);
    } catch {
      toast.error(t('errorLoadingAgents'));
    } finally {
      setIsLoadingAgents(false);
    }
  }, [t]);

  const handleAssignClick = useCallback(() => {
    // Check if there are active assignments
    const hasActiveAssignment = assignments.some(assignment => assignment.is_active && !assignment.is_finished);
    if (hasActiveAssignment) {
      toast.warning(t('orderAlreadyAssigned'), {
        description: t('orderAlreadyAssignedDesc'),
      });
      return;
    }
    setShowAssignDialog(true);
    loadAgents();
  }, [assignments, t, loadAgents]);

  const handleAssignPickupAgent = useCallback(async () => {
    if (!selectedAgentId) {
      toast.error(t('agentRequired'));
      return;
    }

    setIsAssigning(true);
    try {
      const assignment = await assignPickupAgent(orderId, selectedAgentId, assignmentNotes.trim() || undefined);
      setAssignments(prev => [...prev, assignment]);
      setShowAssignDialog(false);
      setSelectedAgentId(null);
      setAssignmentNotes("");
      toast.success(t('agentAssignedSuccess'));
      // Reload order and assignments to get updated info
      const [updatedOrder, updatedAssignments] = await Promise.all([
        fetchOrder(orderId),
        fetchOrderAssignments(orderId)
      ]);
      setOrder(updatedOrder);
      setAssignments(updatedAssignments);
    } catch (error) {
      // Handle 403 Forbidden specifically (order already assigned)
      const err = error as { status?: number };
      if (err?.status === 403) {
        toast.error(t('agentAssignedFailed'), {
          description: t('orderAlreadyAssignedError') || t('orderAlreadyAssignedDesc'),
        });
      } else {
        const message = error instanceof Error ? error.message : tCommon('tryAgain');
        toast.error(t('agentAssignedFailed'), { description: message });
      }
    } finally {
      setIsAssigning(false);
    }
  }, [orderId, selectedAgentId, assignmentNotes, t, tCommon]);

  const handleAcceptOrder = useCallback(async () => {
    if (!selectedInventoryId) {
      toast.error(t('inventoryRequired'));
      return;
    }

    setIsAccepting(true);
    try {
      const updatedOrder = await acceptOrder(orderId, selectedInventoryId);
      setOrder(updatedOrder);
      setShowAcceptDialog(false);
      toast.success(t('orderAcceptedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('tryAgain');
      toast.error(t('orderAcceptedFailed'), { description: message });
    } finally {
      setIsAccepting(false);
    }
  }, [orderId, selectedInventoryId, t, tCommon]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'), {
      description: label,
    });
  }, [t]);


  if (hasPermission === null || hasPermission === false || isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  interface OrderWithRelations extends Order {
    items?: OrderItem[];
    vendor?: { id: number; name_en?: string; name_ar?: string; name?: string; [key: string]: unknown };
  }
  const orderWithRelations = order as OrderWithRelations;
  const customer: Customer = orderWithRelations.customer || { name: '', mobile: '', address: '' };
  const items = orderWithRelations.items || [];
  const vendor: { id?: number; name_en?: string; name_ar?: string; name?: string; [key: string]: unknown } = orderWithRelations.vendor || {};
  const canAccept = order.status === 'pending' && canAcceptOrderPerm;
  // Can assign pickup agent only if order is accepted or confirmed
  const canAssignPickupAgent = canAssignPickupAgentPerm && (order.status === 'accepted' || order.status === 'confirmed');

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/orders')}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('title')}
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('orderDetails')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Print label button - only show if pickup agent is assigned (any active assignment) */}
          {assignments.some(assignment => 
            assignment.is_active && 
            !assignment.is_finished
          ) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              {t('printLabel')}
            </Button>
          )}
          <OrderStatusBadge status={order.status} statusLabel={order.status_label} />
          <PaymentStatusBadge status={order.payment_status} statusLabel={order.payment_status_label} />
        </div>
      </div>

      {/* Action Buttons */}
      {(canAccept || canAssignPickupAgent) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{t('orderActions')}</p>
                <p className="text-sm text-muted-foreground">{t('orderActionsDesc')}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                {canAccept && (
                  <>
                    <Button
                      onClick={handleAcceptClick}
                      disabled={isAccepting}
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t('acceptOrder')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectClick}
                      disabled={isRejecting}
                      className="gap-2 flex-1 sm:flex-initial"
                    >
                      <XCircle className="h-4 w-4" />
                      {t('rejectOrder')}
                    </Button>
                  </>
                )}
                {canAssignPickupAgent && (
                  <Button
                    variant="outline"
                    onClick={handleAssignClick}
                    disabled={isAssigning || assignments.some(a => a.is_active && !a.is_finished)}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Truck className="h-4 w-4" />
                    {assignments.some(a => a.is_active && !a.is_finished) 
                      ? t('reassignPickupAgent') 
                      : t('assignPickupAgent')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments - Show at top if exists */}
      {assignments.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-indigo-500" />
              </div>
              <CardTitle>{t('assignments')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{assignment.assignment_type_label}</p>
                        <p className="text-xs text-muted-foreground">{assignment.status_label}</p>
                      </div>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                    {/* Assigned To (Agent) */}
                    {assignment.assigned_to && Object.keys(assignment.assigned_to).length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">{t('assignedTo')}</p>
                        </div>
                        <div className="ps-6 space-y-1">
                          <p className="font-medium">
                            {locale === 'ar' && assignment.assigned_to.name_ar
                              ? assignment.assigned_to.name_ar
                              : assignment.assigned_to.name_en || assignment.assigned_to.name || 'N/A'}
                          </p>
                          {assignment.assigned_to.mobile && (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground" dir="ltr">{assignment.assigned_to.mobile}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(assignment.assigned_to!.mobile || '', t('mobileNumber'))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {assignment.assigned_to.email && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{assignment.assigned_to.email}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(assignment.assigned_to!.email || '', t('customerEmail'))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">{t('assignedTo')}</p>
                        </div>
                        <div className="ps-6">
                          <p className="text-sm text-muted-foreground italic">{t('notAssigned')}</p>
                        </div>
                      </div>
                    )}

                    {/* Assigned By */}
                    {assignment.assigned_by && Object.keys(assignment.assigned_by).length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">{t('assignedBy')}</p>
                        </div>
                        <div className="ps-6 space-y-1">
                          <p className="font-medium">
                            {locale === 'ar' && assignment.assigned_by.name_ar
                              ? assignment.assigned_by.name_ar
                              : assignment.assigned_by.name_en || assignment.assigned_by.name || 'N/A'}
                          </p>
                          {assignment.assigned_by.mobile && (
                            <p className="text-xs text-muted-foreground" dir="ltr">{assignment.assigned_by.mobile}</p>
                          )}
                          {assignment.assigned_by.email && (
                            <p className="text-xs text-muted-foreground">{assignment.assigned_by.email}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">{t('assignedBy')}</p>
                        </div>
                        <div className="ps-6">
                          <p className="text-sm text-muted-foreground italic">{t('notAssigned')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {assignment.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">{t('notes')}</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{assignment.notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {assignment.assigned_at && (
                      <div>
                        <p className="font-medium mb-1">{t('assignedAt')}</p>
                        <p className="text-foreground">{new Date(assignment.assigned_at).toLocaleString(locale)}</p>
                      </div>
                    )}
                    {assignment.accepted_at && (
                      <div>
                        <p className="font-medium mb-1">{t('acceptedAt')}</p>
                        <p className="text-foreground">{new Date(assignment.accepted_at).toLocaleString(locale)}</p>
                      </div>
                    )}
                    {assignment.picked_up_at && (
                      <div>
                        <p className="font-medium mb-1">{t('pickedUpAt')}</p>
                        <p className="text-foreground">{new Date(assignment.picked_up_at).toLocaleString(locale)}</p>
                      </div>
                    )}
                    {assignment.completed_at && (
                      <div>
                        <p className="font-medium mb-1">{t('completedAt')}</p>
                        <p className="text-foreground">{new Date(assignment.completed_at).toLocaleString(locale)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Information Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle>{t('customerInformation')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.name && (
              <div>
                <p className="text-xs text-muted-foreground">{t('customerName')}</p>
                <p className="font-medium">{customer.name}</p>
              </div>
            )}
            {customer.mobile && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('customerMobile')}</p>
                  <p className="font-medium" dir="ltr">{customer.mobile}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(customer.mobile, t('customerMobile'))}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('customerEmail')}</p>
                  <p className="font-medium text-sm">{customer.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(customer.email || '', t('customerEmail'))}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {customer.full_address && (
              <div>
                <p className="text-xs text-muted-foreground">{t('deliveryAddress')}</p>
                <p className="font-medium text-sm">{customer.full_address}</p>
              </div>
            )}
            {!customer.full_address && customer.address && (
              <div>
                <p className="text-xs text-muted-foreground">{t('deliveryAddress')}</p>
                <p className="font-medium text-sm">{customer.address}</p>
              </div>
            )}
            {customer.address_notes && (
              <div>
                <p className="text-xs text-muted-foreground">{t('addressNotes')}</p>
                <p className="font-medium text-sm text-muted-foreground">{customer.address_notes}</p>
              </div>
            )}
            {(customer.governorate || customer.city) && (
              <div className="flex items-center gap-4 text-xs">
                {customer.governorate && (
                  <div>
                    <p className="text-muted-foreground">{t('governorate')}</p>
                    <p className="font-medium">{customer.governorate}</p>
                  </div>
                )}
                {customer.city && (
                  <div>
                    <p className="text-muted-foreground">{t('city')}</p>
                    <p className="font-medium">{customer.city}</p>
                  </div>
                )}
              </div>
            )}
            {customer.has_coordinates && customer.latitude && customer.longitude && (
              <div>
                <p className="text-xs text-muted-foreground">{t('coordinates')}</p>
                <p className="font-medium text-sm font-mono">
                  {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-green-500" />
              </div>
              <CardTitle>{t('orderDetails')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('orderNumber')}</p>
                <p className="font-medium font-mono">{order.order_number}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(order.order_number, t('orderNumber'))}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('trackingNumber')}</p>
                <p className="font-medium font-mono">{order.track_number}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(order.track_number, t('trackingNumber'))}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/track/${order.track_number}`)}
                className="h-auto p-0 text-xs text-primary hover:underline gap-1.5"
              >
                <ExternalLink className="h-3 w-3" />
                {t('viewTracking')}
              </Button>
            </div>
            {order.qr_code && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('qrCode')}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(order.qr_code, t('qrCode'))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-center p-3 bg-white rounded-lg border">
                  <QRCodeSVG
                    value={order.qr_code}
                    size={128}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-500" />
              </div>
              <CardTitle>{t('paymentInformation')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentMethod')}</p>
              <p className="font-medium">
                {order.payment_method === 'cod' ? t('cashOnDelivery') : t('paid')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('paymentStatus')}</p>
              <p className="font-medium">{order.payment_status_label}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {items.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle>{t('orderItems')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name || t('product')} #{index + 1}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{t('quantity')}: {item.quantity}</span>
                        {item.unit_price && (
                          <span>{t('pricePerUnit')}: {tCommon('egpSymbol')} {item.unit_price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    {item.unit_price && (
                      <div className="text-end">
                        <p className="text-xs text-muted-foreground">{t('itemTotal')}</p>
                        <p className="font-semibold">{tCommon('egpSymbol')} {(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.subtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span className="font-medium">{tCommon('egpSymbol')} {order.subtotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('shippingCost')}</span>
                <span className="font-medium">{tCommon('egpSymbol')} {order.shipping_cost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">{t('total')}</span>
                <span className="font-bold text-lg">{tCommon('egpSymbol')} {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {(order.vendor_notes || (!isVendor && order.internal_notes)) && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle>{t('notes')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.vendor_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('vendorNotes')}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{order.vendor_notes}</p>
                </div>
              )}
              {!isVendor && order.internal_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('internalNotes')}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{order.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* Order Status & Dates */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-500" />
              </div>
              <CardTitle>{t('orderTimeline')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('createdAt')}</p>
                <p className="font-medium text-sm">
                  {new Date(order.created_at).toLocaleString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{tCommon('lastUpdated')}</p>
                <p className="font-medium text-sm">
                  {new Date(order.updated_at).toLocaleString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {order.rejected_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('rejectedAt')}</p>
                  <p className="font-medium text-sm">
                    {new Date(order.rejected_at).toLocaleString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {order.rejection_reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('rejectionReason')}</p>
                  <p className="font-medium text-sm text-destructive">{order.rejection_reason}</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${order.is_in_phase1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs text-muted-foreground">{t('phase1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${order.is_in_phase2 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs text-muted-foreground">{t('phase2')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Pickup Agent Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignPickupAgent')}</DialogTitle>
            <DialogDescription>{t('assignPickupAgentDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id">{t('selectAgent')} *</Label>
              {isLoadingAgents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <Select
                  value={selectedAgentId?.toString() || ''}
                  onValueChange={(value) => setSelectedAgentId(parseInt(value))}
                >
                  <SelectTrigger id="agent_id">
                    <SelectValue placeholder={t('selectAgentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {locale === 'ar' && agent.name_ar ? agent.name_ar : agent.name_en || agent.name}
                        {agent.mobile && ` - ${agent.mobile}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {agents.length === 0 && !isLoadingAgents && (
                <p className="text-xs text-destructive">{t('noAgentsAvailable')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment_notes">{t('assignmentNotes')} ({t('optional')})</Label>
              <Textarea
                id="assignment_notes"
                placeholder={t('assignmentNotesPlaceholder')}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t('assignmentNotesHelp')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedAgentId(null);
                setAssignmentNotes("");
              }}
              disabled={isAssigning}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleAssignPickupAgent}
              disabled={isAssigning || !selectedAgentId}
              className="gap-2"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('assigning')}
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  {t('assignPickupAgent')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              disabled={isRejecting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectOrder}
              disabled={isRejecting}
              className="gap-2"
            >
              {isRejecting ? (
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
              disabled={isAccepting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleAcceptOrder}
              disabled={isAccepting || !selectedInventoryId || isLoadingInventories}
              className="gap-2"
            >
              {isAccepting ? (
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

      {/* Print-Only Shipping Label */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the print label */
          body * {
            visibility: hidden;
          }
          
          /* Show only the print label */
          .print-label,
          .print-label * {
            visibility: visible;
          }
          
          /* Position the label */
          .print-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
          }
          
          /* Hide navigation and other dashboard elements */
          nav,
          aside,
          header,
          .sidebar,
          .app-sidebar,
          button:not(.print-label button),
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure only one page */
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      
      <div className="hidden print:block print-label">
        <div className="w-full h-full p-4 bg-white">
          <div className="max-w-lg mx-auto border-2 border-gray-900 bg-white relative" style={{ pageBreakAfter: 'avoid', pageBreakInside: 'avoid' }}>
            {/* Vertical line on the left */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900"></div>
            
            <div className="p-6 ps-8 space-y-4">
              {/* Header with LABEL, ORDER NUMBER, QR Code, and Tawsila */}
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 uppercase tracking-wide text-gray-900" style={{ fontFamily: 'sans-serif' }}>{t('label')}</h2>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 uppercase mb-1">{t('orderNumber')}</p>
                    <div className="font-bold text-3xl font-mono tracking-wider text-gray-900 leading-tight">
                      {order.order_number.split('-').map((part, idx) => (
                        <div key={idx} className="break-all">{part}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 ms-4">
                  {order.qr_code && (
                    <div className="flex-shrink-0">
                      <QRCodeSVG
                        value={order.qr_code}
                        size={100}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-end text-end">
                    <div className="text-gray-400 text-lg font-semibold opacity-60" style={{ fontFamily: 'sans-serif' }}>{tApp('name')}</div>
                    <div className="text-gray-400 text-xs opacity-60 leading-tight" style={{ maxWidth: '140px', wordWrap: 'break-word', fontFamily: 'sans-serif' }}>
                      {tApp('tagline')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ship To Section */}
              <div className="space-y-2 border-b border-gray-300 pb-3">
                <h3 className="font-bold text-base uppercase tracking-wide text-gray-900" style={{ fontFamily: 'sans-serif' }}>{t('shipTo')}</h3>
                <div className="space-y-1">
                  {customer.name && (
                    <p className="font-bold text-base text-gray-900">{customer.name}</p>
                  )}
                  {customer.mobile && (
                    <p className="text-sm font-mono" dir="ltr">{customer.mobile}</p>
                  )}
                  {(customer.full_address || customer.address) && (
                    <div className="mt-2">
                      <p className="text-sm leading-relaxed text-gray-900">
                        {customer.full_address || customer.address}
                      </p>
                      {customer.address_notes && (
                        <p className="text-xs mt-1 text-gray-600 italic">{customer.address_notes}</p>
                      )}
                    </div>
                  )}
                  {(customer.governorate || customer.city) && (
                    <p className="text-sm text-gray-700 font-medium">
                      {[customer.city, customer.governorate].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items Summary */}
              {items.length > 0 && (
                <div className="border-b border-gray-300 pb-3">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-gray-900 mb-2" style={{ fontFamily: 'sans-serif' }}>{t('items')}: {items.length}</h3>
                  <div className="space-y-1 text-xs">
                    {items.slice(0, 5).map((item: OrderItem, index: number) => (
                      <div key={index} className="flex justify-between text-gray-700">
                        <span className="flex-1">{item.product_name || `${t('product')} ${index + 1}`}</span>
                        <span className="font-semibold ms-2">{tCommon('qty')}: {item.quantity}</span>
                      </div>
                    ))}
                    {items.length > 5 && (
                      <p className="text-xs text-gray-600 italic mt-1">+{items.length - 5} {t('moreItems')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2">
                {(vendor.name_en || vendor.name_ar || vendor.name) && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-900 uppercase" style={{ fontFamily: 'sans-serif' }}>{t('vendor')}</p>
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      {locale === 'ar' && vendor.name_ar ? vendor.name_ar : vendor.name_en || vendor.name}
                    </p>
                  </div>
                )}
                <div className="text-center pt-2 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-900" style={{ fontFamily: 'sans-serif' }}>{t('handleWithCare')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
