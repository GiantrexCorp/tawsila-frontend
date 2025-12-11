"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Loader2, Package, RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

// Hooks
import { usePagePermission } from "@/hooks/use-page-permission";
import { useHasPermission, PERMISSIONS } from "@/hooks/use-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useOrders,
  useAcceptOrder,
  useRejectOrder,
  useAssignPickupAgent,
  type OrderFilters,
} from "@/hooks/queries/use-orders";

// Components
import { FilterBar } from "@/components/ui/filter-bar";
import {
  OrdersStatsCards,
  OrdersViewToggle,
  OrdersTable,
  OrdersCardGrid,
  OrderActionDialogs,
  getOrdersFilterConfigs,
  DEFAULT_ORDER_FILTERS,
  type ViewType,
} from "@/components/orders";

// Services
import type { Order } from "@/lib/services/orders";

const ORDERS_PER_PAGE = 50;
const VIEW_STORAGE_KEY = "orders-view-preference";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isMobile = useIsMobile();

  // View state (persisted to localStorage)
  const [view, setView] = useState<ViewType>("cards");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>({});

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Permissions
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
    ],
  });
  const { hasPermission: canCreateOrder } = useHasPermission(PERMISSIONS.CREATE_ORDER);

  // React Query
  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useOrders(currentPage, ORDERS_PER_PAGE, appliedFilters);

  const acceptOrderMutation = useAcceptOrder();
  const rejectOrderMutation = useRejectOrder();
  const assignAgentMutation = useAssignPickupAgent();

  // Initialize view from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedView === "table" || savedView === "cards") {
      setView(savedView);
    } else {
      // Default based on device
      setView(isMobile ? "cards" : "table");
    }
  }, [isMobile]);

  // Save view preference
  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView);
    localStorage.setItem(VIEW_STORAGE_KEY, newView);
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const newFilters: OrderFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newFilters[key] = value;
      }
    });
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  }, [filters]);

  const handleRemoveFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setAppliedFilters((prev) => {
      const newApplied = { ...prev };
      delete newApplied[key];
      return newApplied;
    });
    setCurrentPage(1);
  }, []);

  // Navigation
  const handleOrderClick = useCallback(
    (orderId: number) => {
      router.push(`/dashboard/orders/${orderId}`);
    },
    [router]
  );

  // Action handlers
  const handleAcceptClick = useCallback(
    (orderId: number) => {
      const order = ordersResponse?.data.find((o) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowAcceptDialog(true);
      }
    },
    [ordersResponse?.data]
  );

  const handleRejectClick = useCallback(
    (orderId: number) => {
      const order = ordersResponse?.data.find((o) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowRejectDialog(true);
      }
    },
    [ordersResponse?.data]
  );

  const handleAssignClick = useCallback(
    (orderId: number) => {
      const order = ordersResponse?.data.find((o) => o.id === orderId);
      if (order) {
        const inventoryId = order.inventory_id || order.inventory?.id;
        if (!inventoryId) {
          toast.error(t("noInventoryAssigned"));
          return;
        }
        setSelectedOrder(order);
        setShowAssignDialog(true);
      }
    },
    [ordersResponse?.data, t]
  );

  // Mutation handlers
  const handleAcceptConfirm = useCallback(
    async (inventoryId: number) => {
      if (!selectedOrder) return;
      try {
        await acceptOrderMutation.mutateAsync({
          id: selectedOrder.id,
          inventoryId,
        });
        toast.success(t("orderAcceptedSuccess"));
        setShowAcceptDialog(false);
        setSelectedOrder(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon("tryAgain");
        toast.error(t("orderAcceptedFailed"), { description: message });
      }
    },
    [selectedOrder, acceptOrderMutation, t, tCommon]
  );

  const handleRejectConfirm = useCallback(
    async (reason?: string) => {
      if (!selectedOrder) return;
      try {
        await rejectOrderMutation.mutateAsync({
          id: selectedOrder.id,
          reason,
        });
        toast.success(t("orderRejectedSuccess"));
        setShowRejectDialog(false);
        setSelectedOrder(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon("tryAgain");
        toast.error(t("orderRejectedFailed"), { description: message });
      }
    },
    [selectedOrder, rejectOrderMutation, t, tCommon]
  );

  const handleAssignConfirm = useCallback(
    async (agentId: number, notes?: string) => {
      if (!selectedOrder) return;
      try {
        await assignAgentMutation.mutateAsync({
          orderId: selectedOrder.id,
          agentId,
          notes,
        });
        toast.success(t("agentAssignedSuccess"));
        setShowAssignDialog(false);
        setSelectedOrder(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon("tryAgain");
        toast.error(t("agentAssignedFailed"), { description: message });
      }
    },
    [selectedOrder, assignAgentMutation, t, tCommon]
  );

  // Computed values
  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.meta?.total || 0;
  const totalPages = ordersResponse?.meta?.last_page || 1;

  const stats = useMemo(() => {
    return {
      total: totalOrders,
      pending: orders.filter((o) => o.status === "pending").length,
      inTransit: orders.filter((o) =>
        ["in_transit", "picked_up", "out_for_delivery"].includes(o.status)
      ).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  }, [orders, totalOrders]);

  const filterConfigs = useMemo(() => getOrdersFilterConfigs(t), [t]);

  // Loading state
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("refreshData")}</span>
          </Button>
          {canCreateOrder && (
            <Button
              onClick={() => router.push("/dashboard/orders/new")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("createOrder")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <OrdersStatsCards stats={stats} isLoading={isLoading} t={t} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onClearAllFilters={handleClearAllFilters}
        onApplyFilters={handleApplyFilters}
        onRemoveFilter={handleRemoveFilter}
        defaultFilters={DEFAULT_ORDER_FILTERS}
      />

      {/* View Toggle & Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-32 inline-block" />
          ) : (
            <>
              {totalOrders} {t("ordersFound")}
              {Object.keys(appliedFilters).length > 0 && ` (${t("filtered")})`}
            </>
          )}
        </span>
        <OrdersViewToggle view={view} onViewChange={handleViewChange} t={t} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {view === "table" ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {Object.keys(appliedFilters).length > 0
                ? t("noOrdersMatchFilter")
                : t("noOrders")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {Object.keys(appliedFilters).length > 0
                ? t("tryDifferentFilters")
                : t("noOrdersDesc")}
            </p>
            {Object.keys(appliedFilters).length > 0 && (
              <Button variant="outline" onClick={handleClearAllFilters}>
                {t("clearFilters")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === "table" ? (
        <OrdersTable
          orders={orders}
          onOrderClick={handleOrderClick}
          onAccept={handleAcceptClick}
          onReject={handleRejectClick}
          onAssignAgent={handleAssignClick}
          t={t}
          tCommon={tCommon}
        />
      ) : (
        <OrdersCardGrid
          orders={orders}
          onOrderClick={handleOrderClick}
          onAccept={handleAcceptClick}
          onReject={handleRejectClick}
          onAssignAgent={handleAssignClick}
          t={t}
          tCommon={tCommon}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isFetching}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isFetching}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}

      {/* Action Dialogs */}
      <OrderActionDialogs
        selectedOrder={selectedOrder}
        showAcceptDialog={showAcceptDialog}
        onAcceptDialogClose={() => {
          setShowAcceptDialog(false);
          setSelectedOrder(null);
        }}
        onAcceptConfirm={handleAcceptConfirm}
        isAccepting={acceptOrderMutation.isPending}
        showRejectDialog={showRejectDialog}
        onRejectDialogClose={() => {
          setShowRejectDialog(false);
          setSelectedOrder(null);
        }}
        onRejectConfirm={handleRejectConfirm}
        isRejecting={rejectOrderMutation.isPending}
        showAssignDialog={showAssignDialog}
        onAssignDialogClose={() => {
          setShowAssignDialog(false);
          setSelectedOrder(null);
        }}
        onAssignConfirm={handleAssignConfirm}
        isAssigning={assignAgentMutation.isPending}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}
