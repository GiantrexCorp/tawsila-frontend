"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle, XCircle, Truck, Store, Warehouse, UserCheck } from "lucide-react";
import type { Order, Assignment } from "@/lib/services/orders";
import { cn } from "@/lib/utils";

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: number) => void;
  onAccept?: (orderId: number) => void;
  onReject?: (orderId: number) => void;
  onCancel?: (orderId: number) => void;
  onAssignAgent?: (orderId: number) => void;
  onAssignDeliveryAgent?: (orderId: number) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  // Selection props
  selectedOrderIds?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  isSelectionMode?: boolean;
}

export function OrdersTable({
  orders,
  onOrderClick,
  onAccept,
  onReject,
  onCancel,
  onAssignAgent,
  onAssignDeliveryAgent,
  t,
  tCommon,
  selectedOrderIds = new Set(),
  onSelectionChange,
  isSelectionMode = false,
}: OrdersTableProps) {
  const locale = useLocale();

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = new Set(orders.map((order) => order.id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedOrderIds);
    if (checked) {
      newSelection.add(orderId);
    } else {
      newSelection.delete(orderId);
    }
    onSelectionChange(newSelection);
  };

  const isAllSelected = orders.length > 0 && orders.every((order) => selectedOrderIds.has(order.id));
  const isSomeSelected = orders.some((order) => selectedOrderIds.has(order.id)) && !isAllSelected;

  // Helper to get location name based on phase
  const getLocationInfo = (order: Order) => {
    const isPhase1 = !!order.is_in_phase1;
    const isPhase2 = !!order.is_in_phase2;

    if (isPhase1 && order.vendor) {
      return {
        label: t("atVendor"),
        name: locale === "ar" ? order.vendor.name_ar : order.vendor.name_en || order.vendor.name,
        icon: Store,
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        iconClass: "text-amber-600",
        rowClass: "shadow-[inset_4px_0_0_0_rgb(245,158,11)]",
      };
    }
    if (isPhase2 && order.inventory) {
      return {
        label: t("atInventory"),
        name: locale === "ar" ? order.inventory.name_ar : order.inventory.name_en || order.inventory.name,
        icon: Warehouse,
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        iconClass: "text-blue-600",
        rowClass: "shadow-[inset_4px_0_0_0_rgb(59,130,246)]",
      };
    }
    return null;
  };

  // Helper to get assignment type label
  const getAssignmentTypeLabel = (type: string) => {
    if (type === "inventory_to_customer") return t("deliveryAgent");
    if (type === "vendor_to_inventory") return t("pickupAgent");
    return t("agent");
  };

  // Helper to get active assignment info
  const getAssignmentInfo = (order: Order) => {
    if (!order.assignments || order.assignments.length === 0) return null;
    const deliveryAssignment = order.assignments.find(
      (a: Assignment) => a.assignment_type === "inventory_to_customer" && a.is_active
    );
    if (deliveryAssignment) {
      return {
        type: "inventory_to_customer",
        label: getAssignmentTypeLabel("inventory_to_customer"),
        statusLabel: deliveryAssignment.status_label,
        agent: deliveryAssignment.assigned_to,
      };
    }
    const pickupAssignment = order.assignments.find(
      (a: Assignment) => a.assignment_type === "vendor_to_inventory" && a.is_active
    );
    if (pickupAssignment) {
      return {
        type: "vendor_to_inventory",
        label: getAssignmentTypeLabel("vendor_to_inventory"),
        statusLabel: pickupAssignment.status_label,
        agent: pickupAssignment.assigned_to,
      };
    }
    return null;
  };

  return (
    <Card className="w-full">
      <div className="w-full overflow-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: isSelectionMode ? 1060 : 1000 }}>
          <thead className="bg-muted/50 sticky top-0">
            <tr className="border-b">
              {isSelectionMode && (
                <th className="h-12 px-4 text-center align-middle w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isSomeSelected;
                      }
                    }}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("selectAll")}
                  />
                </th>
              )}
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("orderNumber")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("customer")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("currentLocation")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("assignedAgent")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("status")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("paymentStatus")}
              </th>
              <th className="h-12 px-4 text-end align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("total")}
              </th>
              <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground whitespace-nowrap">
                {t("createdAt")}
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap w-[60px]">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const canAccept = order.can_accept === true;
              const canReject = order.can_reject === true;
              const canCancel = order.can_cancel === true;
              const canAssignPickupAgent = order.can_assign_pickup_agent === true;
              const canAssignDeliveryAgent = order.can_assign_delivery_agent === true;
              const hasActions = canAccept || canReject || canCancel || canAssignPickupAgent || canAssignDeliveryAgent;
              const locationInfo = getLocationInfo(order);
              const assignmentInfo = getAssignmentInfo(order);
              const agentName = assignmentInfo?.agent
                ? locale === "ar"
                  ? assignmentInfo.agent.name_ar || assignmentInfo.agent.name
                  : assignmentInfo.agent.name_en || assignmentInfo.agent.name
                : null;
              const isSelected = selectedOrderIds.has(order.id);

              // When selection is enabled, clicking row toggles selection
              // Otherwise, clicking row navigates to order detail
              const handleRowClick = () => {
                if (isSelectionMode) {
                  handleSelectOrder(order.id, !isSelected);
                } else {
                  onOrderClick(order.id);
                }
              };

              return (
                <tr
                  key={order.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 cursor-pointer",
                    locationInfo?.rowClass,
                    isSelected && isSelectionMode && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={handleRowClick}
                >
                  {isSelectionMode && (
                    <td className="p-4 align-middle text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked === true)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${t("selectOrder")} ${order.order_number}`}
                      />
                    </td>
                  )}
                  <td className="p-4 align-middle">
                    <div>
                      <p className="font-medium whitespace-nowrap">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                        {order.track_number}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div>
                      <p className="font-medium whitespace-nowrap">{order.customer?.name || "-"}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                        {order.customer?.mobile || "-"}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {locationInfo ? (
                      <div className="flex items-center gap-2">
                        <locationInfo.icon className={cn("h-4 w-4 shrink-0", locationInfo.iconClass)} />
                        <div className="min-w-0">
                          <Badge variant="outline" className={cn("text-xs mb-0.5", locationInfo.badgeClass)}>
                            {locationInfo.label}
                          </Badge>
                          <p className="text-sm whitespace-nowrap">{locationInfo.name || "-"}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    {assignmentInfo ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 shrink-0 text-green-600" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 whitespace-nowrap">
                              {assignmentInfo.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {assignmentInfo.statusLabel}
                            </Badge>
                          </div>
                          <p className="text-sm mt-0.5 whitespace-nowrap">
                            {agentName || t("agentPending")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm whitespace-nowrap">{t("notAssigned")}</span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    <OrderStatusBadge
                      status={order.status}
                      statusLabel={order.status_label}
                    />
                  </td>
                  <td className="p-4 align-middle">
                    <PaymentStatusBadge
                      status={order.payment_status}
                      statusLabel={order.payment_status_label}
                    />
                  </td>
                  <td className="p-4 align-middle text-end font-medium whitespace-nowrap">
                    {tCommon("egpSymbol")} {order.total_amount.toFixed(2)}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString(locale)}
                  </td>
                  <td className="p-4 align-middle text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onOrderClick(order.id)}>
                          <Eye className="h-4 w-4 me-2" />
                          {t("viewOrder")}
                        </DropdownMenuItem>
                        {hasActions && <DropdownMenuSeparator />}
                        {canAccept && onAccept && (
                          <DropdownMenuItem onClick={() => onAccept(order.id)}>
                            <CheckCircle className="h-4 w-4 me-2 text-green-600" />
                            {t("acceptOrder")}
                          </DropdownMenuItem>
                        )}
                        {canReject && onReject && (
                          <DropdownMenuItem onClick={() => onReject(order.id)}>
                            <XCircle className="h-4 w-4 me-2 text-destructive" />
                            {t("rejectOrder")}
                          </DropdownMenuItem>
                        )}
                        {canCancel && onCancel && (
                          <DropdownMenuItem onClick={() => onCancel(order.id)}>
                            <XCircle className="h-4 w-4 me-2 text-destructive" />
                            {t("cancelOrder")}
                          </DropdownMenuItem>
                        )}
                        {canAssignPickupAgent && onAssignAgent && (
                          <DropdownMenuItem onClick={() => onAssignAgent(order.id)}>
                            <Truck className="h-4 w-4 me-2 text-blue-600" />
                            {t("assignPickupAgent")}
                          </DropdownMenuItem>
                        )}
                        {canAssignDeliveryAgent && onAssignDeliveryAgent && (
                          <DropdownMenuItem onClick={() => onAssignDeliveryAgent(order.id)}>
                            <Truck className="h-4 w-4 me-2 text-green-600" />
                            {t("assignDeliveryAgent")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
