"use client";

import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { User, MapPin, Package, CheckCircle, XCircle, Truck, Eye, Store, Warehouse, UserCheck } from "lucide-react";
import type { Order, Assignment } from "@/lib/services/orders";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onAssignAgent?: () => void;
  onAssignDeliveryAgent?: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OrderCard({
  order,
  onClick,
  onAccept,
  onReject,
  onAssignAgent,
  onAssignDeliveryAgent,
  t,
  tCommon,
}: OrderCardProps) {
  const locale = useLocale();
  const customer = order.customer || { name: "", mobile: "", address: "" };
  const canAccept = order.can_accept === true;
  const canReject = order.can_reject === true;
  const canAssignPickupAgent = order.can_assign_pickup_agent === true;
  const canAssignDeliveryAgent = order.can_assign_delivery_agent === true;

  // Determine phase-based styling and location
  // Use truthy check instead of strict boolean comparison to handle 1/true/"1" etc.
  const isPhase1 = !!order.is_in_phase1;
  const isPhase2 = !!order.is_in_phase2;

  // Get location name based on phase
  const getLocationName = () => {
    if (isPhase1 && order.vendor) {
      return locale === "ar" ? order.vendor.name_ar : order.vendor.name_en || order.vendor.name;
    }
    if (isPhase2 && order.inventory) {
      return locale === "ar" ? order.inventory.name_ar : order.inventory.name_en || order.inventory.name;
    }
    return "-";
  };

  // Phase indicator colors
  const phaseStyles = {
    phase1: {
      border: "border-l-4 border-l-amber-500",
      gradient: "from-amber-500/10",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      icon: Store,
    },
    phase2: {
      border: "border-l-4 border-l-blue-500",
      gradient: "from-blue-500/10",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: Warehouse,
    },
  };

  const currentPhase = isPhase1 ? phaseStyles.phase1 : isPhase2 ? phaseStyles.phase2 : null;
  const LocationIcon = currentPhase?.icon || MapPin;

  // Get active assignment (vendor_to_inventory or inventory_to_customer)
  const getActiveAssignment = (): Assignment | null => {
    if (!order.assignments || order.assignments.length === 0) return null;
    // Find active assignment, prioritize delivery (inventory_to_customer) over pickup (vendor_to_inventory)
    const deliveryAssignment = order.assignments.find(
      (a) => a.assignment_type === "inventory_to_customer" && a.is_active
    );
    if (deliveryAssignment) return deliveryAssignment;
    const pickupAssignment = order.assignments.find(
      (a) => a.assignment_type === "vendor_to_inventory" && a.is_active
    );
    return pickupAssignment || null;
  };

  // Get assignment type label
  const getAssignmentTypeLabel = (type: string) => {
    if (type === "inventory_to_customer") return t("deliveryAgent");
    if (type === "vendor_to_inventory") return t("pickupAgent");
    return t("agent");
  };

  const activeAssignment = getActiveAssignment();
  const assignedAgentName = activeAssignment?.assigned_to
    ? locale === "ar"
      ? activeAssignment.assigned_to.name_ar || activeAssignment.assigned_to.name
      : activeAssignment.assigned_to.name_en || activeAssignment.assigned_to.name
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer",
        currentPhase?.border
      )}
      onClick={onClick}
    >
      {/* Status Badge - Floating */}
      <div className="absolute top-3 end-3 z-10">
        <OrderStatusBadge status={order.status} statusLabel={order.status_label} />
      </div>

      {/* Hover Gradient Overlay - Phase-based */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        currentPhase?.gradient || "from-primary/5"
      )} />

      <CardContent className="p-4 sm:p-5">
        {/* Order Number & Track Number with Phase Badge */}
        <div className="mb-4 pe-20">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base sm:text-lg truncate">
              {order.order_number}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {order.track_number}
          </p>
        </div>

        {/* Location Info - Phase Based */}
        {currentPhase && (
          <div className="mb-3 p-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <LocationIcon className={cn(
                "h-4 w-4 shrink-0",
                isPhase1 ? "text-amber-600" : "text-blue-600"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs px-1.5 py-0", currentPhase.badge)}>
                    {isPhase1 ? t("atVendor") : t("atInventory")}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate mt-0.5">
                  {getLocationName()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Agent Info */}
        {activeAssignment && (
          <div className="mb-3 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
                    {getAssignmentTypeLabel(activeAssignment.assignment_type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {activeAssignment.status_label}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate mt-0.5 text-green-800 dark:text-green-300">
                  {assignedAgentName || t("agentPending")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{customer.name || "-"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {customer.full_address || customer.address || "-"}
            </span>
          </div>
        </div>

        {/* Payment & Amount */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <PaymentStatusBadge
            status={order.payment_status}
            statusLabel={order.payment_status_label}
          />
          <div className="text-end">
            <p className="font-bold text-lg">
              {tCommon("egpSymbol")} {order.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Footer: Date & Item Count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{new Date(order.created_at).toLocaleDateString(locale)}</span>
          <div className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            <span>{order.subtotal > 0 ? t("itemsIncluded") : t("noItems")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-wrap gap-2 pt-3 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[80px]"
            onClick={onClick}
          >
            <Eye className="h-4 w-4 me-1.5" />
            {t("viewOrder")}
          </Button>

          {canAccept && onAccept && (
            <Button
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={onAccept}
            >
              <CheckCircle className="h-4 w-4 me-1.5" />
              {t("accept")}
            </Button>
          )}

          {canReject && onReject && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={onReject}
            >
              <XCircle className="h-4 w-4 me-1.5" />
              {t("reject")}
            </Button>
          )}

          {canAssignPickupAgent && onAssignAgent && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={onAssignAgent}
            >
              <Truck className="h-4 w-4 me-1.5" />
              {t("assignPickupAgent")}
            </Button>
          )}

          {canAssignDeliveryAgent && onAssignDeliveryAgent && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={onAssignDeliveryAgent}
            >
              <Truck className="h-4 w-4 me-1.5" />
              {t("assignDeliveryAgent")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
