"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
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
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  QrCode,
  Scan,
  ChevronRight,
  Store,
  Warehouse,
  CircleDot,
  CheckCircle2,
  Circle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Rocket,
  Wrench,
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { PERMISSIONS } from "@/hooks/use-permissions";
import { fetchOrder, acceptOrder, rejectOrder, assignPickupAgent, assignDeliveryAgent, skipScan, skipVerifyOtp, type Order, type OrderItem, type Customer, type Assignment, type StatusLog, type Scan as ScanType, type Vendor, type OrderTransaction } from "@/lib/services/orders";
import { fetchMyInventories, fetchCurrentInventory, type Inventory } from "@/lib/services/inventories";
import { fetchPickupAgents, fetchDeliveryAgents, type Agent } from "@/lib/services/agents";
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
import { cn } from "@/lib/utils";
import { BackendImage } from "@/components/ui/backend-image";
import { ShippingLabel } from "@/components/print";
import "@/components/print/print-styles.css";

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  const currentUser = getCurrentUser();
  const isVendor = currentUser?.roles?.some(r => r.name === 'vendor');

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
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [showAssignDeliveryDialog, setShowAssignDeliveryDialog] = useState(false);
  const [deliveryAgents, setDeliveryAgents] = useState<Agent[]>([]);
  const [selectedDeliveryAgentId, setSelectedDeliveryAgentId] = useState<number | null>(null);
  const [deliveryAssignmentNotes, setDeliveryAssignmentNotes] = useState("");
  const [isLoadingDeliveryAgents, setIsLoadingDeliveryAgents] = useState(false);
  const hasLoadedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // For portal mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Skip action states
  const [showSkipPickupDialog, setShowSkipPickupDialog] = useState(false);
  const [showSkipReceiveDialog, setShowSkipReceiveDialog] = useState(false);
  const [showSkipDispatchDialog, setShowSkipDispatchDialog] = useState(false);
  const [showSkipDeliveryDialog, setShowSkipDeliveryDialog] = useState(false);
  const [isSkipActionLoading, setIsSkipActionLoading] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  useEffect(() => {
    // Only load once when permission is granted (ref persists across Strict Mode remounts)
    if (!hasPermission || hasLoadedRef.current) return;

    const loadOrder = async () => {
      if (!orderId || isNaN(orderId)) {
        toast.error(t('errorLoadingOrder'), {
          description: tCommon('invalidOrderId'),
        });
        router.push('/dashboard/orders');
        return;
      }

      hasLoadedRef.current = true;
      setIsLoading(true);
      try {
        const fetchedOrder = await fetchOrder(orderId);
        setOrder(fetchedOrder);
        // Assignments are already included in the order response
        if (fetchedOrder.assignments) {
          setAssignments(fetchedOrder.assignments);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon('tryAgain');
        toast.error(t('errorLoadingOrder'), { description: message });
        router.push('/dashboard/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, hasPermission]);

  const loadInventories = useCallback(async () => {
    setIsLoadingInventories(true);
    try {
      try {
        const currentInventory = await fetchCurrentInventory();
        setInventories([currentInventory]);
        setSelectedInventoryId(currentInventory.id);
      } catch {
        const myInventories = await fetchMyInventories();
        setInventories(myInventories);
        if (myInventories.length > 0) {
          setSelectedInventoryId(myInventories[0].id);
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

  const loadAgents = useCallback(async (inventoryId: number) => {
    setIsLoadingAgents(true);
    try {
      const fetchedAgents = await fetchPickupAgents(inventoryId);
      setAgents(fetchedAgents);
    } catch {
      toast.error(t('errorLoadingAgents'));
    } finally {
      setIsLoadingAgents(false);
    }
  }, [t]);

  const loadDeliveryAgents = useCallback(async (inventoryId: number) => {
    setIsLoadingDeliveryAgents(true);
    try {
      const fetchedAgents = await fetchDeliveryAgents(inventoryId);
      setDeliveryAgents(fetchedAgents);
    } catch {
      toast.error(t('errorLoadingAgents'));
    } finally {
      setIsLoadingDeliveryAgents(false);
    }
  }, [t]);

  const handleAssignClick = useCallback(() => {
    const hasActiveAssignment = assignments.some(assignment => assignment.is_active && !assignment.is_finished);
    if (hasActiveAssignment) {
      toast.warning(t('orderAlreadyAssigned'), {
        description: t('orderAlreadyAssignedDesc'),
      });
      return;
    }
    const inventoryId = order?.inventory_id || order?.inventory?.id;
    if (!inventoryId) {
      toast.error(t('noInventoryAssigned'));
      return;
    }
    setShowAssignDialog(true);
    loadAgents(inventoryId);
  }, [assignments, t, loadAgents, order?.inventory_id, order?.inventory?.id]);

  const handleAssignDeliveryClick = useCallback(() => {
    const hasActiveDeliveryAssignment = assignments.some(
      assignment => assignment.is_active && !assignment.is_finished && assignment.assignment_type === 'inventory_to_customer'
    );
    if (hasActiveDeliveryAssignment) {
      toast.warning(t('orderAlreadyAssigned'), {
        description: t('orderAlreadyAssignedDesc'),
      });
      return;
    }
    const inventoryId = order?.inventory_id || order?.inventory?.id;
    if (!inventoryId) {
      toast.error(t('noInventoryAssigned'));
      return;
    }
    setShowAssignDeliveryDialog(true);
    loadDeliveryAgents(inventoryId);
  }, [assignments, t, loadDeliveryAgents, order?.inventory_id, order?.inventory?.id]);

  const handleAssignPickupAgent = useCallback(async () => {
    if (!selectedAgentId) {
      toast.error(t('agentRequired'));
      return;
    }

    setIsAssigning(true);
    try {
      await assignPickupAgent(orderId, selectedAgentId, assignmentNotes.trim() || undefined);
      setShowAssignDialog(false);
      setSelectedAgentId(null);
      setAssignmentNotes("");
      toast.success(t('agentAssignedSuccess'));
      // Refresh order data (assignments included)
      const updatedOrder = await fetchOrder(orderId);
      setOrder(updatedOrder);
      if (updatedOrder.assignments) {
        setAssignments(updatedOrder.assignments);
      }
      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
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
  }, [orderId, selectedAgentId, assignmentNotes, router, t, tCommon]);

  const handleAssignDeliveryAgent = useCallback(async () => {
    if (!selectedDeliveryAgentId) {
      toast.error(t('agentRequired'));
      return;
    }

    setIsAssigningDelivery(true);
    try {
      await assignDeliveryAgent(orderId, selectedDeliveryAgentId, deliveryAssignmentNotes.trim() || undefined);
      setShowAssignDeliveryDialog(false);
      setSelectedDeliveryAgentId(null);
      setDeliveryAssignmentNotes("");
      toast.success(t('agentAssignedSuccess'));
      // Refresh order data (assignments included)
      const updatedOrder = await fetchOrder(orderId);
      setOrder(updatedOrder);
      if (updatedOrder.assignments) {
        setAssignments(updatedOrder.assignments);
      }
      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
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
      setIsAssigningDelivery(false);
    }
  }, [orderId, selectedDeliveryAgentId, deliveryAssignmentNotes, router, t, tCommon]);

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
    toast.success(t('copied'), { description: label });
  }, [t]);

  // Skip action handlers for admin
  const handleSkipPickup = useCallback(async () => {
    setIsSkipActionLoading(true);
    try {
      await skipScan(orderId);
      setShowSkipPickupDialog(false);
      toast.success(t('orderMarkedPickedUp'));
      // Refetch the complete order data to refresh all information
      const refreshedOrder = await fetchOrder(orderId);
      setOrder(refreshedOrder);
      if (refreshedOrder.assignments) {
        setAssignments(refreshedOrder.assignments);
      }
    } catch (error) {
      const err = error as { status?: number };
      setShowSkipPickupDialog(false);
      if (err?.status === 501) {
        setShowComingSoonDialog(true);
      } else if (err?.status === 403) {
        toast.error(t('skipActionFailed'), { description: t('noPermissionForAction') });
      } else {
        const message = error instanceof Error ? error.message : t('invalidOrderStatus');
        toast.error(t('skipActionFailed'), { description: message });
      }
    } finally {
      setIsSkipActionLoading(false);
    }
  }, [orderId, t]);

  const handleSkipReceive = useCallback(async () => {
    setIsSkipActionLoading(true);
    try {
      await skipScan(orderId);
      setShowSkipReceiveDialog(false);
      toast.success(t('orderMarkedReceived'));
      // Refetch the complete order data to refresh all information
      const refreshedOrder = await fetchOrder(orderId);
      setOrder(refreshedOrder);
      if (refreshedOrder.assignments) {
        setAssignments(refreshedOrder.assignments);
      }
    } catch (error) {
      const err = error as { status?: number };
      setShowSkipReceiveDialog(false);
      if (err?.status === 501) {
        setShowComingSoonDialog(true);
      } else if (err?.status === 403) {
        toast.error(t('skipActionFailed'), { description: t('noPermissionForAction') });
      } else {
        const message = error instanceof Error ? error.message : t('invalidOrderStatus');
        toast.error(t('skipActionFailed'), { description: message });
      }
    } finally {
      setIsSkipActionLoading(false);
    }
  }, [orderId, t]);

  const handleSkipDispatch = useCallback(async () => {
    setIsSkipActionLoading(true);
    try {
      await skipScan(orderId);
      setShowSkipDispatchDialog(false);
      toast.success(t('orderMarkedOutForDelivery'));
      // Refetch the complete order data to refresh all information
      const refreshedOrder = await fetchOrder(orderId);
      setOrder(refreshedOrder);
      if (refreshedOrder.assignments) {
        setAssignments(refreshedOrder.assignments);
      }
    } catch (error) {
      const err = error as { status?: number };
      setShowSkipDispatchDialog(false);
      if (err?.status === 501) {
        setShowComingSoonDialog(true);
      } else if (err?.status === 403) {
        toast.error(t('skipActionFailed'), { description: t('noPermissionForAction') });
      } else {
        const message = error instanceof Error ? error.message : t('invalidOrderStatus');
        toast.error(t('skipActionFailed'), { description: message });
      }
    } finally {
      setIsSkipActionLoading(false);
    }
  }, [orderId, t]);

  const handleSkipDelivery = useCallback(async () => {
    setIsSkipActionLoading(true);
    try {
      await skipVerifyOtp(orderId);
      setShowSkipDeliveryDialog(false);
      toast.success(t('orderMarkedDelivered'));
      // Refetch the complete order data to refresh all information
      const refreshedOrder = await fetchOrder(orderId);
      setOrder(refreshedOrder);
      if (refreshedOrder.assignments) {
        setAssignments(refreshedOrder.assignments);
      }
    } catch (error) {
      const err = error as { status?: number };
      setShowSkipDeliveryDialog(false);
      if (err?.status === 501) {
        setShowComingSoonDialog(true);
      } else if (err?.status === 403) {
        toast.error(t('skipActionFailed'), { description: t('noPermissionForAction') });
      } else {
        const message = error instanceof Error ? error.message : t('invalidOrderStatus');
        toast.error(t('skipActionFailed'), { description: message });
      }
    } finally {
      setIsSkipActionLoading(false);
    }
  }, [orderId, t]);

  if (hasPermission === null || hasPermission === false || isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">{t('loadingOrder')}</p>
        </div>
      </div>
    );
  }

  interface OrderWithRelations extends Order {
    items?: OrderItem[];
    status_logs?: StatusLog[];
    scans?: ScanType[];
    transactions?: OrderTransaction[];
  }
  const orderWithRelations = order as OrderWithRelations;
  const customer: Customer = orderWithRelations.customer || { name: '', mobile: '', address: '' };
  const items = orderWithRelations.items || [];
  const vendor: Vendor | undefined = orderWithRelations.vendor;
  const statusLogs = orderWithRelations.status_logs || [];
  const scans = orderWithRelations.scans || [];
  const inventory = orderWithRelations.inventory;
  const transactions = orderWithRelations.transactions || [];
  const canAccept = order.can_accept === true;
  const canReject = order.can_reject === true;
  const canAssignPickupAgent = order.can_assign_pickup_agent === true;
  const canAssignDeliveryAgent = order.can_assign_delivery_agent === true;

  // Admin skip action flags
  const canMarkPickedUp = order.can_mark_picked_up_from_vendor === true;
  const canMarkReceived = order.can_mark_received_at_inventory === true;
  const canMarkOutForDelivery = order.can_mark_out_for_delivery === true;
  const canMarkDelivered = order.can_mark_delivered === true;
  const hasAdminSkipActions = canMarkPickedUp || canMarkReceived || canMarkOutForDelivery || canMarkDelivered;

  // Phase indicator
  const isPhase1 = !!order.is_in_phase1;
  const isPhase2 = !!order.is_in_phase2;

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/orders')}
        className="gap-2 text-muted-foreground hover:text-foreground -ms-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToOrders')}
      </Button>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 border shadow-sm">
        {/* Phase Indicator Strip */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isPhase1 && "bg-gradient-to-r from-amber-500 to-orange-500",
          isPhase2 && "bg-gradient-to-r from-blue-500 to-cyan-500",
          !isPhase1 && !isPhase2 && "bg-gradient-to-r from-gray-300 to-gray-400"
        )} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: Order Info */}
            <div className="flex-1 space-y-4">
              {/* Order Number & Status */}
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('orderNumber')}</p>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-mono">{order.order_number}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <OrderStatusBadge status={order.status} statusLabel={order.status_label} />
                  <PaymentStatusBadge status={order.payment_status} statusLabel={order.payment_status_label} />
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(order.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {order.track_number && (
                  <button
                    onClick={() => copyToClipboard(order.track_number, t('trackingNumber'))}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    <span className="font-mono text-xs">{order.track_number}</span>
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Phase Indicator Pills */}
              <div className="flex items-center gap-2 pt-2">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isPhase1 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"
                )}>
                  <Store className="h-3.5 w-3.5" />
                  <span>{t('phase1')}</span>
                  {isPhase1 && <CircleDot className="h-3 w-3 animate-pulse" />}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isPhase2 ? "bg-blue-500/20 text-blue-700 dark:text-blue-400" : "bg-muted text-muted-foreground"
                )}>
                  <Warehouse className="h-3.5 w-3.5" />
                  <span>{t('phase2')}</span>
                  {isPhase2 && <CircleDot className="h-3 w-3 animate-pulse" />}
                </div>
              </div>

              {/* Action Buttons */}
              {(canAccept || canReject || canAssignPickupAgent || canAssignDeliveryAgent) && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {canAccept && (
                    <Button onClick={handleAcceptClick} disabled={isAccepting} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t('acceptOrder')}
                    </Button>
                  )}
                  {canReject && (
                    <Button variant="destructive" onClick={handleRejectClick} disabled={isRejecting} className="gap-2">
                      <XCircle className="h-4 w-4" />
                      {t('rejectOrder')}
                    </Button>
                  )}
                  {canAssignPickupAgent && (
                    <Button
                      variant="outline"
                      onClick={handleAssignClick}
                      disabled={isAssigning || assignments.some(a => a.is_active && !a.is_finished && a.assignment_type === 'vendor_to_inventory')}
                      className="gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      {t('assignPickupAgent')}
                    </Button>
                  )}
                  {canAssignDeliveryAgent && (
                    <Button
                      variant="outline"
                      onClick={handleAssignDeliveryClick}
                      disabled={isAssigningDelivery || assignments.some(a => a.is_active && !a.is_finished && a.assignment_type === 'inventory_to_customer')}
                      className="gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      {t('assignDeliveryAgent')}
                    </Button>
                  )}
                </div>
              )}

              {/* Print Button - Vendor Only */}
              {isVendor && (
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button variant="outline" onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    {t('printLabel')}
                  </Button>
                </div>
              )}

              {/* Admin Skip Actions */}
              {hasAdminSkipActions && (
                <div className="pt-4 border-t mt-4">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t('adminSkipActions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {canMarkPickedUp && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkipPickupDialog(true)}
                        disabled={isSkipActionLoading}
                        className="gap-2 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        <Truck className="h-4 w-4" />
                        {t('markPickedUp')}
                      </Button>
                    )}
                    {canMarkReceived && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkipReceiveDialog(true)}
                        disabled={isSkipActionLoading}
                        className="gap-2 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        <Warehouse className="h-4 w-4" />
                        {t('markReceivedAtWarehouse')}
                      </Button>
                    )}
                    {canMarkOutForDelivery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkipDispatchDialog(true)}
                        disabled={isSkipActionLoading}
                        className="gap-2 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        <Truck className="h-4 w-4" />
                        {t('markOutForDelivery')}
                      </Button>
                    )}
                    {canMarkDelivered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkipDeliveryDialog(true)}
                        disabled={isSkipActionLoading}
                        className="gap-2 border-red-500/50 text-red-700 dark:text-red-400 hover:bg-red-500/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t('markAsDelivered')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: QR Code */}
            {order.qr_code && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm">
                <QRCodeSVG value={order.qr_code} size={120} level="M" includeMargin={false} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/track/${order.track_number}`)}
                  className="text-xs gap-1.5 h-8"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('viewTracking')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Customer Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('customerInformation')}</h3>
                <p className="text-xs text-muted-foreground">{t('deliveryDetails')}</p>
              </div>
            </div>

            <div className="space-y-3">
              {customer.name && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                </div>
              )}

              {customer.mobile && (
                <button
                  onClick={() => copyToClipboard(customer.mobile, t('customerMobile'))}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Phone className="h-4 w-4" />
                  <span dir="ltr" className="flex-1 text-start">{customer.mobile}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {customer.email && (
                <button
                  onClick={() => copyToClipboard(customer.email || '', t('customerEmail'))}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Mail className="h-4 w-4" />
                  <span className="flex-1 text-start truncate">{customer.email}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {(customer.full_address || customer.address) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground">{customer.full_address || customer.address}</p>
                    {customer.address_notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">{customer.address_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vendor Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('vendorInformation')}</h3>
                <p className="text-xs text-muted-foreground">{t('orderSource')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {vendor?.logo ? (
                  <BackendImage src={vendor.logo} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{locale === 'ar' ? vendor?.name_ar : vendor?.name_en || vendor?.name}</p>
                </div>
              </div>

              {vendor?.mobile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{vendor.mobile}</span>
                </div>
              )}

              {vendor?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('paymentInformation')}</h3>
                <p className="text-xs text-muted-foreground">{order.payment_method === 'cod' ? t('cashOnDelivery') : t('paid')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium">{tCommon('egpSymbol')} {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('shippingCost')}</span>
                <span className="font-medium">{tCommon('egpSymbol')} {order.shipping_cost.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t('total')}</span>
                <span className="text-xl font-bold text-primary">{tCommon('egpSymbol')} {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Card */}
        {transactions.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('transactions') || 'Transactions'}</h3>
                  <p className="text-xs text-muted-foreground">{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center",
                        transaction.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      )}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.category_label}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>#{transaction.reference_number}</span>
                          <span>•</span>
                          <span>{new Date(transaction.created_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {transaction.created_by && (
                            <>
                              <span>•</span>
                              <span>{locale === 'ar' ? transaction.created_by.name_ar : transaction.created_by.name_en}</span>
                            </>
                          )}
                        </div>
                        {transaction.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <p className={cn(
                        "font-semibold",
                        transaction.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {transaction.type === 'credit' ? '+' : '-'}{tCommon('egpSymbol')} {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('balanceAfter') || 'Balance'}: {tCommon('egpSymbol')} {transaction.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Items - Full Width */}
        {items.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('orderItems')}</h3>
                    <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? t('item') : t('items')}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {items.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-background border flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product_name || `${t('product')} #${index + 1}`}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span>{t('quantity')}: {item.quantity}</span>
                          {item.unit_price && (
                            <>
                              <span>•</span>
                              <span>{tCommon('egpSymbol')} {item.unit_price.toFixed(2)} / {t('unit')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.unit_price && (
                      <div className="text-end">
                        <p className="font-semibold">{tCommon('egpSymbol')} {(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Location */}
        {inventory && (
          <div className="group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Warehouse className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('inventoryLocation')}</h3>
                  <p className="text-xs text-muted-foreground">{t('currentLocation')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-medium">{locale === 'ar' ? inventory.name_ar : inventory.name_en || inventory.name}</p>
                {inventory.code && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    <span className="font-mono">{inventory.code}</span>
                  </div>
                )}
                {inventory.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{inventory.phone}</span>
                  </div>
                )}
                {(inventory.full_address || inventory.address) && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{inventory.full_address || inventory.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assignments */}
        {assignments.length > 0 && (
          <div className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('assignments')}</h3>
                  <p className="text-xs text-muted-foreground">{assignments.length} {t('assignmentsCount')}</p>
                </div>
              </div>

              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-xl bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={assignment.is_active ? "default" : "secondary"} className="rounded-full">
                          {assignment.is_active ? t('active') : t('completed')}
                        </Badge>
                        <span className="text-sm font-medium">{assignment.assignment_type_label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{assignment.status_label}</span>
                    </div>

                    {assignment.assigned_to && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {locale === 'ar' && assignment.assigned_to.name_ar
                              ? assignment.assigned_to.name_ar
                              : assignment.assigned_to.name_en || assignment.assigned_to.name || 'N/A'}
                          </p>
                          {assignment.assigned_to.mobile && (
                            <p className="text-xs text-muted-foreground" dir="ltr">{assignment.assigned_to.mobile}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                      {assignment.assigned_at && (
                        <div>
                          <span className="font-medium">{t('assignedAt')}:</span>{' '}
                          {new Date(assignment.assigned_at).toLocaleString(locale)}
                        </div>
                      )}
                      {assignment.completed_at && (
                        <div>
                          <span className="font-medium">{t('completedAt')}:</span>{' '}
                          {new Date(assignment.completed_at).toLocaleString(locale)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline - Full Width */}
        {statusLogs.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('orderTimeline')}</h3>
                  <p className="text-xs text-muted-foreground">{t('statusHistory')}</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {statusLogs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-4 ps-10">
                      <div className={cn(
                        "absolute start-0 top-1 h-8 w-8 rounded-full flex items-center justify-center",
                        index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {index === 0 ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{log.to_status_label || log.status_label || log.to_status || log.status || t('statusChanged')}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString(locale)}
                          </span>
                        </div>
                        {(log.from_status_label || log.from_status) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {t('from')}: {log.from_status_label || log.from_status}
                          </p>
                        )}
                        {log.created_by && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {t('by')}: {log.created_by.name || log.created_by.name_en}
                          </p>
                        )}
                        {(log.notes || log.reason) && (
                          <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                            {log.notes || log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scans */}
        {scans.length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Scan className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('scanHistory')}</h3>
                  <p className="text-xs text-muted-foreground">{scans.length} {t('scansRecorded')}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {scans.map((scan) => (
                  <div key={scan.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="rounded-full">{scan.scan_type_label || scan.scan_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(scan.scanned_at).toLocaleString(locale)}
                      </span>
                    </div>
                    {scan.scanned_by && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{scan.scanned_by.name || scan.scanned_by.name_en}</span>
                      </div>
                    )}
                    {scan.has_coordinates && scan.coordinates && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="font-mono">{scan.coordinates}</span>
                      </div>
                    )}
                    {scan.device_info && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{scan.device_info}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {(order.vendor_notes || (!isVendor && order.internal_notes)) && (
          <div className="md:col-span-2 lg:col-span-3 group relative overflow-hidden rounded-2xl bg-card border p-5 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('notes')}</h3>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {order.vendor_notes && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('vendorNotes')}</p>
                    <p className="text-sm">{order.vendor_notes}</p>
                  </div>
                )}
                {!isVendor && order.internal_notes && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('internalNotes')}</p>
                    <p className="text-sm">{order.internal_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Info */}
        {order.rejection_reason && (
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">{t('orderRejected')}</h3>
                {order.rejected_at && (
                  <p className="text-xs text-destructive/70 mt-1">
                    {new Date(order.rejected_at).toLocaleString(locale)}
                  </p>
                )}
                <p className="text-sm mt-2">{order.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
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
                <Select value={selectedAgentId?.toString() || ''} onValueChange={(value) => setSelectedAgentId(parseInt(value))}>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignDialog(false); setSelectedAgentId(null); setAssignmentNotes(""); }} disabled={isAssigning}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAssignPickupAgent} disabled={isAssigning || !selectedAgentId} className="gap-2">
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {isAssigning ? t('assigning') : t('assignPickupAgent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDeliveryDialog} onOpenChange={setShowAssignDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignDeliveryAgent')}</DialogTitle>
            <DialogDescription>{t('assignDeliveryAgentDesc') || t('assignPickupAgentDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_agent_id">{t('selectAgent')} *</Label>
              {isLoadingDeliveryAgents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <Select value={selectedDeliveryAgentId?.toString() || ''} onValueChange={(value) => setSelectedDeliveryAgentId(parseInt(value))}>
                  <SelectTrigger id="delivery_agent_id">
                    <SelectValue placeholder={t('selectAgentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {locale === 'ar' && agent.name_ar ? agent.name_ar : agent.name_en || agent.name}
                        {agent.mobile && ` - ${agent.mobile}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_assignment_notes">{t('assignmentNotes')} ({t('optional')})</Label>
              <Textarea
                id="delivery_assignment_notes"
                placeholder={t('assignmentNotesPlaceholder')}
                value={deliveryAssignmentNotes}
                onChange={(e) => setDeliveryAssignmentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignDeliveryDialog(false); setSelectedDeliveryAgentId(null); setDeliveryAssignmentNotes(""); }} disabled={isAssigningDelivery}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAssignDeliveryAgent} disabled={isAssigningDelivery || !selectedDeliveryAgentId} className="gap-2">
              {isAssigningDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {isAssigningDelivery ? t('assigning') : t('assignDeliveryAgent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason(""); }} disabled={isRejecting}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRejectOrder} disabled={isRejecting} className="gap-2">
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isRejecting ? t('rejecting') : t('rejectOrder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Select value={selectedInventoryId?.toString() || ''} onValueChange={(value) => setSelectedInventoryId(parseInt(value))}>
                  <SelectTrigger id="inventory">
                    <SelectValue placeholder={t('selectInventoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventories.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id.toString()}>
                        {inv.name_en || inv.name_ar || inv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)} disabled={isAccepting}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAcceptOrder} disabled={isAccepting || !selectedInventoryId} className="gap-2">
              {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isAccepting ? t('accepting') : t('acceptOrder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Pickup Dialog */}
      <Dialog open={showSkipPickupDialog} onOpenChange={setShowSkipPickupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>{t('confirmManualPickup')}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('confirmManualPickupMessage')}</p>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">{t('confirmManualPickupUseCases')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('confirmManualPickupCase1')}</li>
                <li>{t('confirmManualPickupCase2')}</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">{t('actionWillBeLogged')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipPickupDialog(false)} disabled={isSkipActionLoading}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSkipPickup} disabled={isSkipActionLoading} className="gap-2 bg-amber-600 hover:bg-amber-700">
              {isSkipActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {isSkipActionLoading ? t('markingPickedUp') : t('confirmPickup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Receive at Warehouse Dialog */}
      <Dialog open={showSkipReceiveDialog} onOpenChange={setShowSkipReceiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>{t('confirmManualWarehouseReceipt')}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('confirmManualWarehouseReceiptMessage')}</p>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">{t('confirmManualWarehouseReceiptUseCases')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('confirmManualWarehouseReceiptCase1')}</li>
                <li>{t('confirmManualWarehouseReceiptCase2')}</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">{t('actionWillBeLogged')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipReceiveDialog(false)} disabled={isSkipActionLoading}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSkipReceive} disabled={isSkipActionLoading} className="gap-2 bg-amber-600 hover:bg-amber-700">
              {isSkipActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Warehouse className="h-4 w-4" />}
              {isSkipActionLoading ? t('markingReceived') : t('confirmReceipt')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dispatch Dialog */}
      <Dialog open={showSkipDispatchDialog} onOpenChange={setShowSkipDispatchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>{t('confirmManualDispatch')}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('confirmManualDispatchMessage')}</p>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">{t('confirmManualDispatchUseCases')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('confirmManualDispatchCase1')}</li>
                <li>{t('confirmManualDispatchCase2')}</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">{t('actionWillBeLogged')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDispatchDialog(false)} disabled={isSkipActionLoading}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSkipDispatch} disabled={isSkipActionLoading} className="gap-2 bg-amber-600 hover:bg-amber-700">
              {isSkipActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {isSkipActionLoading ? t('markingOutForDelivery') : t('confirmDispatch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Delivery (OTP Bypass) Dialog - Critical Action */}
      <Dialog open={showSkipDeliveryDialog} onOpenChange={setShowSkipDeliveryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>{t('confirmManualDelivery')}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('confirmManualDeliveryMessage')}</p>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('confirmManualDeliveryWarning')}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">{t('confirmManualDeliveryUseCases')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('confirmManualDeliveryCase1')}</li>
                <li>{t('confirmManualDeliveryCase2')}</li>
                <li>{t('confirmManualDeliveryCase3')}</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">{t('confirmManualDeliveryConfirmation')}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t('confirmManualDeliveryConfirm1')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t('confirmManualDeliveryConfirm2')}
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground italic">{t('actionWillBeLogged')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDeliveryDialog(false)} disabled={isSkipActionLoading}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSkipDelivery} disabled={isSkipActionLoading} variant="destructive" className="gap-2">
              {isSkipActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isSkipActionLoading ? t('markingDelivered') : t('confirmDelivery')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Coming Soon Dialog */}
      <Dialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            {/* Animated Icon */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Wrench className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Rocket className="h-3.5 w-3.5 text-amber-600 animate-bounce" />
              </div>
            </div>

            {/* Title */}
            <DialogTitle className="text-xl font-bold mb-2">
              {t('featureComingSoon')}
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="text-center max-w-sm">
              {t('featureComingSoonMessage')}
            </DialogDescription>

            {/* Visual decoration */}
            <div className="flex items-center gap-2 mt-6 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>

            {/* Additional info */}
            <p className="text-xs text-muted-foreground mt-4">
              {t('featureUnderDevelopmentDesc')}
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowComingSoonDialog(false)} className="gap-2 min-w-[120px]">
              <CheckCircle className="h-4 w-4" />
              {t('gotIt')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Label - Rendered via portal to body */}
      {isMounted && order && createPortal(
        <div className="print-container">
          <div className="print-page">
            <ShippingLabel order={order} t={t} tCommon={tCommon} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
