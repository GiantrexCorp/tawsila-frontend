"use client";

import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { User, MapPin, Package, CheckCircle, XCircle, Truck, Eye } from "lucide-react";
import type { Order } from "@/lib/services/orders";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onAssignAgent?: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OrderCard({
  order,
  onClick,
  onAccept,
  onReject,
  onAssignAgent,
  t,
  tCommon,
}: OrderCardProps) {
  const locale = useLocale();
  const customer = order.customer || { name: "", mobile: "", address: "" };
  const canAccept = order.can_accept === true;
  const canReject = order.can_reject === true;
  const canAssignPickupAgent = order.can_assign_pickup_agent === true;

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Status Badge - Floating */}
      <div className="absolute top-3 end-3 z-10">
        <OrderStatusBadge status={order.status} statusLabel={order.status_label} />
      </div>

      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <CardContent className="p-4 sm:p-5">
        {/* Order Number & Track Number */}
        <div className="mb-4 pe-20">
          <h3 className="font-semibold text-base sm:text-lg truncate">
            {order.order_number}
          </h3>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {order.track_number}
          </p>
        </div>

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
              {t("assign")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
