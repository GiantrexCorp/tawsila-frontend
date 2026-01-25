"use client";

import { OrderCard } from "./order-card";
import type { Order } from "@/lib/services/orders";

interface OrdersCardGridProps {
  orders: Order[];
  onOrderClick: (orderId: number) => void;
  onAccept?: (orderId: number) => void;
  onReject?: (orderId: number) => void;
  onAssignAgent?: (orderId: number) => void;
  onAssignDeliveryAgent?: (orderId: number) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  // Selection props
  selectedOrderIds?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  isSelectionMode?: boolean;
}

export function OrdersCardGrid({
  orders,
  onOrderClick,
  onAccept,
  onReject,
  onAssignAgent,
  onAssignDeliveryAgent,
  t,
  tCommon,
  selectedOrderIds = new Set(),
  onSelectionChange,
  isSelectionMode = false,
}: OrdersCardGridProps) {
  const handleOrderSelectionChange = (orderId: number, selected: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedOrderIds);
    if (selected) {
      newSelection.add(orderId);
    } else {
      newSelection.delete(orderId);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onClick={() => onOrderClick(order.id)}
          onAccept={onAccept ? () => onAccept(order.id) : undefined}
          onReject={onReject ? () => onReject(order.id) : undefined}
          onAssignAgent={onAssignAgent ? () => onAssignAgent(order.id) : undefined}
          onAssignDeliveryAgent={onAssignDeliveryAgent ? () => onAssignDeliveryAgent(order.id) : undefined}
          t={t}
          tCommon={tCommon}
          isSelected={selectedOrderIds.has(order.id)}
          onSelectionChange={(selected) => handleOrderSelectionChange(order.id, selected)}
          isSelectionMode={isSelectionMode}
        />
      ))}
    </div>
  );
}
