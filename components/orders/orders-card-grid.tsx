"use client";

import { OrderCard } from "./order-card";
import type { Order } from "@/lib/services/orders";

interface OrdersCardGridProps {
  orders: Order[];
  onOrderClick: (orderId: number) => void;
  onAccept?: (orderId: number) => void;
  onReject?: (orderId: number) => void;
  onAssignAgent?: (orderId: number) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OrdersCardGrid({
  orders,
  onOrderClick,
  onAccept,
  onReject,
  onAssignAgent,
  t,
  tCommon,
}: OrdersCardGridProps) {
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
          t={t}
          tCommon={tCommon}
        />
      ))}
    </div>
  );
}
