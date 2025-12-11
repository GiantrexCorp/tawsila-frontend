"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, Truck, CheckCircle } from "lucide-react";

interface OrdersStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
  };
  isLoading?: boolean;
  t: (key: string) => string;
}

export function OrdersStatsCards({ stats, isLoading, t }: OrdersStatsCardsProps) {
  const cards = [
    {
      title: t("totalOrders"),
      value: stats.total,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: t("pendingOrders"),
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      title: t("inTransitOrders"),
      value: stats.inTransit,
      icon: Truck,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: t("deliveredOrders"),
      value: stats.delivered,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
