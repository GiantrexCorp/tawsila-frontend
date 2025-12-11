"use client";

import { useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle, XCircle, Truck } from "lucide-react";
import type { Order } from "@/lib/services/orders";

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: number) => void;
  onAccept?: (orderId: number) => void;
  onReject?: (orderId: number) => void;
  onAssignAgent?: (orderId: number) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OrdersTable({
  orders,
  onOrderClick,
  onAccept,
  onReject,
  onAssignAgent,
  t,
  tCommon,
}: OrdersTableProps) {
  const locale = useLocale();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">{t("orderNumber")}</TableHead>
            <TableHead className="min-w-[180px]">{t("customer")}</TableHead>
            <TableHead className="min-w-[120px]">{t("status")}</TableHead>
            <TableHead className="min-w-[100px]">{t("paymentStatus")}</TableHead>
            <TableHead className="min-w-[100px] text-end">{t("total")}</TableHead>
            <TableHead className="min-w-[120px]">{t("createdAt")}</TableHead>
            <TableHead className="w-[70px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const canAccept = order.can_accept === true;
            const canReject = order.can_reject === true;
            const canAssignPickupAgent = order.can_assign_pickup_agent === true;
            const hasActions = canAccept || canReject || canAssignPickupAgent;

            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onOrderClick(order.id)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {order.track_number}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {order.customer?.mobile || "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge
                    status={order.status}
                    statusLabel={order.status_label}
                  />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge
                    status={order.payment_status}
                    statusLabel={order.payment_status_label}
                  />
                </TableCell>
                <TableCell className="text-end font-medium">
                  {tCommon("egpSymbol")} {order.total_amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(order.created_at).toLocaleDateString(locale)}
                </TableCell>
                <TableCell>
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
                      {canAssignPickupAgent && onAssignAgent && (
                        <DropdownMenuItem onClick={() => onAssignAgent(order.id)}>
                          <Truck className="h-4 w-4 me-2 text-blue-600" />
                          {t("assignPickupAgent")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
