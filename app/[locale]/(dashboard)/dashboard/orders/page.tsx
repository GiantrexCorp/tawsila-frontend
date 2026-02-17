"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Package, RefreshCw, X, MapPin, Building2, UserCheck, Hash, Phone, Calendar, Filter, ChevronDown, ChevronUp, Printer, Upload } from "lucide-react";
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
  useCancelOrder,
  useAssignPickupAgent,
  useAssignDeliveryAgent,
  type OrderFilters,
} from "@/hooks/queries/use-orders";
import { useAllVendors } from "@/hooks/queries/use-vendors";

// Components
import {
  OrdersStatsCards,
  OrdersViewToggle,
  OrdersTable,
  OrdersCardGrid,
  OrderActionDialogs,
  ImportOrdersDialog,
  type ViewType,
} from "@/components/orders";
import { PrintLabelsDialog } from "@/components/print";

// Print styles
import "@/components/print/print-styles.css";

// Services
import type { Order } from "@/lib/services/orders";
import { fetchAllInventories, type Inventory } from "@/lib/services/inventories";
import { fetchGovernorates, fetchCities, type Governorate, type City } from "@/lib/services/vendors";
import { fetchActiveAgents, type Agent } from "@/lib/services/agents";
import { getCurrentUser } from "@/lib/auth";

import { PAGINATION } from "@/lib/constants/pagination";

const ORDERS_PER_PAGE = PAGINATION.ORDERS;
const VIEW_STORAGE_KEY = "orders-view-preference";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isMobile = useIsMobile();

  // User state for client-side data
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  // Hydrate user data from localStorage
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // View state (persisted to localStorage)
  const [view, setView] = useState<ViewType>("cards");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>({});
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    orderInfo: false,
    customerInfo: false,
    location: false,
    organization: false,
    agent: false,
    status: false,
  });

  // Data for filters (lazy loaded when filters expanded)
  const { data: vendors = [] } = useAllVendors({ enabled: isFiltersExpanded });
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'pickup' | 'delivery'>('pickup');

  // Selection state for batch printing (vendor-only)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
  const [showPrintDialog, setShowPrintDialog] = useState(false);

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
  const { hasPermission: canViewPrintLabel } = useHasPermission(PERMISSIONS.VIEW_PRINT_LABEL);
  const { hasPermission: canImportOrders } = useHasPermission(PERMISSIONS.IMPORT_ORDERS);

  // Import orders dialog
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Only users with type 'vendor' and create-order permission can create orders
  const canShowCreateOrder = canCreateOrder && user?.type === 'vendor';
  const canShowImportOrders = canImportOrders && user?.type === 'vendor';

  // React Query
  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useOrders(currentPage, ORDERS_PER_PAGE, appliedFilters);

  const acceptOrderMutation = useAcceptOrder();
  const rejectOrderMutation = useRejectOrder();
  const cancelOrderMutation = useCancelOrder();
  const assignAgentMutation = useAssignPickupAgent();
  const assignDeliveryAgentMutation = useAssignDeliveryAgent();

  // Track if filter data has been loaded
  const [hasLoadedFilterData, setHasLoadedFilterData] = useState(false);

  // Load data for filters (only when filters are expanded)
  useEffect(() => {
    if (!hasPermission || !isFiltersExpanded || hasLoadedFilterData) return;

    const loadData = async () => {
      setHasLoadedFilterData(true);
      try {
        const [inventoriesData, agentsData, governoratesData] = await Promise.all([
          fetchAllInventories(),
          fetchActiveAgents(),
          fetchGovernorates(),
        ]);
        setInventories(inventoriesData);
        setAgents(agentsData);
        setGovernorates(governoratesData);
      } catch {
        toast.error(tCommon("errorLoadingData"));
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, isFiltersExpanded]);

  // Load cities when governorate is selected
  useEffect(() => {
    if (!filters.governorate_id) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const fetchedCities = await fetchCities(parseInt(filters.governorate_id));
        setCities(fetchedCities);
      } catch {
        toast.error(t("errorLoadingCities"));
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.governorate_id]);

  // Initialize view from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedView === "table" || savedView === "cards") {
      setView(savedView);
    } else {
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
    setFilters((prev) => {
      const newFilters = { ...prev };
      // If value is empty, remove the filter
      if (value === '' || value === undefined) {
        delete newFilters[key];
        // If clearing governorate, also clear city and cities array
        if (key === 'governorate_id') {
          delete newFilters.city_id;
          setCities([]);
        }
      } else {
        newFilters[key] = value;
        // If setting governorate, clear city (city depends on governorate)
        if (key === 'governorate_id') {
          delete newFilters.city_id;
        }
      }
      return newFilters;
    });
  }, []);

  const handleLocationFilterChange = useCallback((governorateId: string, cityId?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (governorateId) {
        newFilters.governorate_id = governorateId;
        if (cityId !== undefined) {
          newFilters.city_id = cityId;
        } else if (!cityId) {
          delete newFilters.city_id;
        }
      } else {
        // Clear governorate and city filters, and reset cities array
        delete newFilters.governorate_id;
        delete newFilters.city_id;
        setCities([]);
      }
      return newFilters;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
    setCities([]);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
    setCities([]);
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const newFilters: OrderFilters = {};

    // Add all filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        // Special handling for date range - must have both dates in YYYY-MM-DD format
        if (key === 'created_at_between') {
          const dateParts = value.split(',');
          const fromDate = dateParts[0]?.trim();
          const toDate = dateParts[1]?.trim();
          // Validate format: YYYY-MM-DD (10 characters, matches regex)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          // Only include if both dates are present, valid length, and match YYYY-MM-DD format
          if (
            dateParts.length === 2 &&
            fromDate &&
            toDate &&
            fromDate.length === 10 &&
            toDate.length === 10 &&
            dateRegex.test(fromDate) &&
            dateRegex.test(toDate)
          ) {
            // Ensure dates are in YYYY-MM-DD format
            newFilters[key as keyof OrderFilters] = `${fromDate},${toDate}`;
          }
        } else {
          newFilters[key as keyof OrderFilters] = value.trim();
        }
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
      const path = `/${locale}/dashboard/orders/${orderId}`;
      window.open(path, '_blank');
    },
    [locale]
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

  const handleCancelClick = useCallback(
    (orderId: number) => {
      const order = ordersResponse?.data.find((o) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowCancelDialog(true);
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
        setAssignmentType('pickup');
        setShowAssignDialog(true);
      }
    },
    [ordersResponse?.data, t]
  );

  const handleAssignDeliveryClick = useCallback(
    (orderId: number) => {
      const order = ordersResponse?.data.find((o) => o.id === orderId);
      if (order) {
        const inventoryId = order.inventory_id || order.inventory?.id;
        if (!inventoryId) {
          toast.error(t("noInventoryAssigned"));
          return;
        }
        setSelectedOrder(order);
        setAssignmentType('delivery');
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

  const handleCancelConfirm = useCallback(
    async (reason: string) => {
      if (!selectedOrder) return;
      try {
        await cancelOrderMutation.mutateAsync({
          id: selectedOrder.id,
          reason,
        });
        toast.success(t("orderCancelledSuccess"));
        setShowCancelDialog(false);
        setSelectedOrder(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon("tryAgain");
        toast.error(t("orderCancelledFailed"), { description: message });
      }
    },
    [selectedOrder, cancelOrderMutation, t, tCommon]
  );

  const handleAssignConfirm = useCallback(
    async (agentId: number, notes?: string) => {
      if (!selectedOrder) return;
      try {
        if (assignmentType === 'pickup') {
          await assignAgentMutation.mutateAsync({
            orderId: selectedOrder.id,
            agentId,
            notes,
          });
        } else {
          await assignDeliveryAgentMutation.mutateAsync({
            orderId: selectedOrder.id,
            agentId,
            notes,
          });
        }
        toast.success(t("agentAssignedSuccess"));
        setShowAssignDialog(false);
        setSelectedOrder(null);
        // Refetch orders to see updated status
        await refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon("tryAgain");
        toast.error(t("agentAssignedFailed"), { description: message });
      }
    },
    [selectedOrder, assignmentType, assignAgentMutation, assignDeliveryAgentMutation, refetch, t, tCommon]
  );

  // Selection handlers for batch printing
  const handleSelectionChange = useCallback((newSelection: Set<number>) => {
    setSelectedOrderIds(newSelection);
  }, []);

  const handleEnterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedOrderIds(new Set());
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    const ordersList = ordersResponse?.data || [];
    const allIds = new Set(ordersList.map((order) => order.id));
    setSelectedOrderIds(allIds);
  }, [ordersResponse?.data]);

  const handlePrintLabels = useCallback(() => {
    if (selectedOrderIds.size === 0) return;
    setShowPrintDialog(true);
  }, [selectedOrderIds.size]);

  const handlePrintDialogClose = useCallback((open: boolean) => {
    setShowPrintDialog(open);
    if (!open) {
      // Exit selection mode after printing
      setIsSelectionMode(false);
      setSelectedOrderIds(new Set());
    }
  }, []);


  // Computed values
  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.meta?.total || 0;
  const totalPages = ordersResponse?.meta?.last_page || 1;

  // Get selected orders for printing
  const selectedOrders = useMemo(() => {
    return orders.filter((order) => selectedOrderIds.has(order.id));
  }, [orders, selectedOrderIds]);

  const stats = useMemo(() => {
    return {
      total: totalOrders,
      pending: ordersResponse?.pending_orders || 0,
      inTransit: ordersResponse?.in_transit || 0,
      delivered: ordersResponse?.delivered || 0,
    };
  }, [ordersResponse]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v && v.trim()).length;
  }, [filters]);

  // Loading state
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {isSelectionMode ? (
          <>
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium">
                {t("selectOrdersToPrint")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitSelectionMode}
            >
              <X className="h-4 w-4 me-1.5" />
              {tCommon("cancel")}
            </Button>
          </>
        ) : (
          <>
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
              {canShowImportOrders && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("importOrders")}</span>
                </Button>
              )}
              {canViewPrintLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnterSelectionMode}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("printLabels")}</span>
                </Button>
              )}
              {canShowCreateOrder && (
                <Button
                  onClick={() => router.push("/dashboard/orders/new")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("createOrder")}</span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <OrdersStatsCards stats={stats} isLoading={isLoading} t={t} />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Filter Header */}
            <div 
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">{t("filters")}</h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ms-2">
                    {activeFiltersCount}
                  </Badge>
                )}
                {isFiltersExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground ms-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ms-2" />
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAllFilters();
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {tCommon("clearAll")}
                </Button>
              )}
            </div>

            {/* Filter Sections - Organized in Two Columns */}
            {isFiltersExpanded && (
              <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Order Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, orderInfo: !prev.orderInfo }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("orderInformation")}</Label>
                      {(filters.order_number || filters.tracking_number) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                          {(filters.order_number ? 1 : 0) + (filters.tracking_number ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.orderInfo ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.orderInfo && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="order-number" className="text-xs text-muted-foreground font-medium">
                          {t("orderNumber")}
                        </Label>
                        <Input
                          id="order-number"
                          value={filters.order_number || ""}
                          onChange={(e) => handleFilterChange("order_number", e.target.value)}
                          placeholder={t("searchByOrderNumber")}
                          className="h-10 bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tracking-number" className="text-xs text-muted-foreground font-medium">
                          {t("trackingNumber")}
                        </Label>
                        <Input
                          id="tracking-number"
                          value={filters.tracking_number || ""}
                          onChange={(e) => handleFilterChange("tracking_number", e.target.value)}
                          placeholder={t("searchByTrackingNumber")}
                          className="h-10 bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, customerInfo: !prev.customerInfo }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("customerInformation")}</Label>
                      {filters.customer_mobile && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.customerInfo ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.customerInfo && (
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone" className="text-xs text-muted-foreground font-medium">
                        {t("customerPhone")}
                      </Label>
                      <Input
                        id="customer-phone"
                        value={filters.customer_mobile || ""}
                        onChange={(e) => handleFilterChange("customer_mobile", e.target.value)}
                        placeholder={t("searchByPhone")}
                        className="h-10 bg-background"
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, location: !prev.location }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("location")}</Label>
                      {(filters.governorate_id || filters.city_id) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                          {(filters.governorate_id ? 1 : 0) + (filters.city_id ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.location ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.location && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="governorate-filter" className="text-xs text-muted-foreground font-normal">
                            {t("governorate")}
                          </Label>
                          <Select
                            value={filters.governorate_id || undefined}
                            onValueChange={(value) => handleLocationFilterChange(value)}
                          >
                            <SelectTrigger id="governorate-filter" className="h-10 bg-background">
                              <SelectValue placeholder={t("selectGovernorate")} />
                            </SelectTrigger>
                            <SelectContent>
                              {governorates.map((gov) => (
                                <SelectItem key={gov.id} value={gov.id.toString()}>
                                  {locale === "ar" ? gov.name_ar : gov.name_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city-filter" className="text-xs text-muted-foreground font-normal">
                            {t("city")}
                          </Label>
                          <Select
                            value={filters.city_id || undefined}
                            onValueChange={(value) => handleLocationFilterChange(filters.governorate_id || "", value)}
                            disabled={!filters.governorate_id || isLoadingCities}
                          >
                            <SelectTrigger id="city-filter" className="h-10 bg-background" disabled={!filters.governorate_id || isLoadingCities}>
                              <SelectValue
                                placeholder={
                                  isLoadingCities
                                    ? t("loadingCities")
                                    : filters.governorate_id
                                      ? t("selectCity")
                                      : locale === "ar"
                                        ? "اختر المحافظة أولاً"
                                        : "Select governorate first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city.id} value={city.id.toString()}>
                                  {locale === "ar" ? city.name_ar : city.name_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {(filters.governorate_id || filters.city_id) && (
                        <div className="flex items-center gap-2 flex-wrap pt-2">
                          {filters.governorate_id && (
                            <Badge variant="secondary" className="gap-1.5">
                              {t("governorate")}:{" "}
                              {governorates.find((g) => g.id.toString() === filters.governorate_id)
                                ? locale === "ar"
                                  ? governorates.find((g) => g.id.toString() === filters.governorate_id)!.name_ar
                                  : governorates.find((g) => g.id.toString() === filters.governorate_id)!.name_en
                                : filters.governorate_id}
                              <button
                                onClick={() => handleLocationFilterChange("")}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                          {filters.city_id && (
                            <Badge variant="secondary" className="gap-1.5">
                              {t("city")}:{" "}
                              {cities.find((c) => c.id.toString() === filters.city_id)
                                ? locale === "ar"
                                  ? cities.find((c) => c.id.toString() === filters.city_id)!.name_ar
                                  : cities.find((c) => c.id.toString() === filters.city_id)!.name_en
                                : filters.city_id}
                              <button
                                onClick={() => handleLocationFilterChange(filters.governorate_id || "", "")}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Organization */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, organization: !prev.organization }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("organization")}</Label>
                      {(filters.vendor_id || filters.inventory_id) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                          {(filters.vendor_id ? 1 : 0) + (filters.inventory_id ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.organization ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.organization && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="vendor-filter" className="text-xs text-muted-foreground font-medium">
                          {t("vendor")}
                        </Label>
                        <Select
                          key={`vendor-${filters.vendor_id || 'none'}`}
                          value={filters.vendor_id || undefined}
                          onValueChange={(value) => handleFilterChange("vendor_id", value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="vendor-filter" className="h-10 bg-background">
                            <SelectValue placeholder={t("selectVendor")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{tCommon("all")}</SelectItem>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                {locale === "ar" ? vendor.name_ar : vendor.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inventory-filter" className="text-xs text-muted-foreground font-medium">
                          {t("inventory")} ({t("warehouse")})
                        </Label>
                        <Select
                          value={filters.inventory_id || undefined}
                          onValueChange={(value) => handleFilterChange("inventory_id", value)}
                        >
                          <SelectTrigger id="inventory-filter" className="h-10 bg-background">
                            <SelectValue placeholder={t("selectInventory")} />
                          </SelectTrigger>
                          <SelectContent>
                            {inventories.map((inventory) => (
                              <SelectItem key={inventory.id} value={inventory.id.toString()}>
                                {locale === "ar" ? inventory.name_ar || inventory.name : inventory.name_en || inventory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, agent: !prev.agent }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("assignedAgent")}</Label>
                      {filters.agent_id && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">1</Badge>
                      )}
                    </div>
                    {expandedSections.agent ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.agent && (
                    <div className="space-y-2">
                      <Label htmlFor="agent-filter" className="text-xs text-muted-foreground font-medium">
                        {t("agent")}
                      </Label>
                      <Select
                        value={filters.agent_id || undefined}
                        onValueChange={(value) => handleFilterChange("agent_id", value)}
                      >
                        <SelectTrigger id="agent-filter" className="h-10 bg-background">
                          <SelectValue placeholder={t("selectAgent")} />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Status & Date */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, status: !prev.status }))}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">{t("statusAndDate")}</Label>
                      {(filters.status || filters.created_at_between || filters.payment_method) && (
                        <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">
                          {(filters.status ? 1 : 0) + (filters.created_at_between ? 1 : 0) + (filters.payment_method ? 1 : 0)}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.status ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.status && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="status-filter" className="text-xs text-muted-foreground font-medium">
                          {t("status")}
                        </Label>
                        <Select
                          key={`status-${filters.status || 'none'}`}
                          value={filters.status || undefined}
                          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="status-filter" className="h-10 bg-background">
                            <SelectValue placeholder={t("selectStatus")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{tCommon("all")}</SelectItem>
                            <SelectItem value="pending">{t("pending")}</SelectItem>
                            <SelectItem value="accepted">{t("accepted")}</SelectItem>
                            <SelectItem value="rejected">{t("rejected")}</SelectItem>
                            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                            <SelectItem value="pickup_assigned">{t("pickupAssigned")}</SelectItem>
                            <SelectItem value="picked_up_from_vendor">{t("pickedUpFromVendor")}</SelectItem>
                            <SelectItem value="received_at_inventory">{t("receivedAtInventory")}</SelectItem>
                            <SelectItem value="delivery_assigned">{t("deliveryAssigned")}</SelectItem>
                            <SelectItem value="out_for_delivery">{t("outForDelivery")}</SelectItem>
                            <SelectItem value="delivered">{t("delivered")}</SelectItem>
                            <SelectItem value="delivery_failed">{t("deliveryFailed")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-range" className="text-xs text-muted-foreground font-medium">
                          {t("dateRange")}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            id="date-from"
                            type="date"
                            value={filters.created_at_between?.split(",")[0] || ""}
                            onChange={(e) => {
                              const to = filters.created_at_between?.split(",")[1] || "";
                              if (e.target.value) {
                                // Ensure date is in YYYY-MM-DD format (HTML date input should already provide this)
                                const fromDate = e.target.value; // Already in YYYY-MM-DD format from date input
                                handleFilterChange("created_at_between", to ? `${fromDate},${to}` : `${fromDate},`);
                              } else {
                                // Clear the entire filter if from date is cleared
                                handleFilterChange("created_at_between", "");
                              }
                            }}
                            className="h-10 bg-background"
                          />
                          <Input
                            id="date-to"
                            type="date"
                            value={filters.created_at_between?.split(",")[1] || ""}
                            onChange={(e) => {
                              const from = filters.created_at_between?.split(",")[0] || "";
                              if (e.target.value) {
                                // Ensure date is in YYYY-MM-DD format (HTML date input should already provide this)
                                const toDate = e.target.value; // Already in YYYY-MM-DD format from date input
                                handleFilterChange("created_at_between", from ? `${from},${toDate}` : `,${toDate}`);
                              } else {
                                // Clear the entire filter if to date is cleared
                                handleFilterChange("created_at_between", "");
                              }
                            }}
                            className="h-10 bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-method-filter" className="text-xs text-muted-foreground font-medium">
                          {t("paymentMethod")}
                        </Label>
                        <Select
                          key={`payment-method-${filters.payment_method || 'none'}`}
                          value={filters.payment_method || undefined}
                          onValueChange={(value) => handleFilterChange("payment_method", value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="payment-method-filter" className="h-10 bg-background">
                            <SelectValue placeholder={tCommon("all")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{tCommon("all")}</SelectItem>
                            <SelectItem value="cash">{t("cash")}</SelectItem>
                            <SelectItem value="card">{t("card")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClearFilters} className="min-w-[100px]">
                {tCommon("clear")}
              </Button>
              <Button onClick={handleApplyFilters} className="min-w-[100px]">
                {tCommon("apply")}
              </Button>
            </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {isFetching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(appliedFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(appliedFilters).map(([key, value]) => {
            if (!value) return null;
            let displayValue = value;
            let label = key;
            
            // Get label for filter
            const labelMap: Record<string, string> = {
              order_number: t("orderNumber"),
              tracking_number: t("trackingNumber"),
              customer_mobile: t("customerPhone"),
              governorate_id: t("governorate"),
              city_id: t("city"),
              vendor_id: t("vendor"),
              inventory_id: t("inventory"),
              agent_id: t("assignedAgent"),
              status: t("status"),
              payment_status: t("paymentStatus"),
              payment_method: t("paymentMethod"),
              created_at_between: t("dateRange"),
            };
            label = labelMap[key] || key;

            if (key === "governorate_id") {
              const gov = governorates.find((g) => g.id.toString() === value);
              displayValue = gov ? (locale === "ar" ? gov.name_ar : gov.name_en) : value;
            } else if (key === "city_id") {
              const city = cities.find((c) => c.id.toString() === value);
              displayValue = city ? (locale === "ar" ? city.name_ar : city.name_en) : value;
            } else if (key === "vendor_id") {
              const vendor = vendors.find((v) => v.id.toString() === value);
              displayValue = vendor ? (locale === "ar" ? vendor.name_ar : vendor.name_en) : value;
            } else if (key === "inventory_id") {
              const inventory = inventories.find((i) => i.id.toString() === value);
              displayValue = inventory ? (locale === "ar" ? inventory.name_ar || inventory.name || "" : inventory.name_en || inventory.name || "") : value;
            } else if (key === "agent_id") {
              const agent = agents.find((a) => a.id.toString() === value);
              displayValue = agent ? agent.name : value;
            } else if (key === "status") {
              displayValue = t(value as string);
            } else if (key === "created_at_between") {
              const [from, to] = value.split(",");
              displayValue = `${from} - ${to}`;
            } else if (key === "payment_method") {
              // Payment method translations
              const paymentMethodMap: Record<string, string> = {
                cash: t("cash") || "Cash",
                card: t("card") || "Card",
              };
              displayValue = paymentMethodMap[value] || value;
            }
            return (
              <Badge key={key} variant="secondary" className="gap-1.5">
                {label}: {displayValue}
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

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
          onCancel={handleCancelClick}
          onAssignAgent={handleAssignClick}
          onAssignDeliveryAgent={handleAssignDeliveryClick}
          t={t}
          tCommon={tCommon}
          selectedOrderIds={selectedOrderIds}
          onSelectionChange={handleSelectionChange}
          isSelectionMode={isSelectionMode}
        />
      ) : (
        <OrdersCardGrid
          orders={orders}
          onOrderClick={handleOrderClick}
          onAccept={handleAcceptClick}
          onReject={handleRejectClick}
          onAssignAgent={handleAssignClick}
          onAssignDeliveryAgent={handleAssignDeliveryClick}
          t={t}
          tCommon={tCommon}
          selectedOrderIds={selectedOrderIds}
          onSelectionChange={handleSelectionChange}
          isSelectionMode={isSelectionMode}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isFetching}
            className="rounded-lg"
          >
            {tCommon("previous")}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isFetching}
                  className="w-9 h-9 p-0 rounded-lg"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isFetching}
            className="rounded-lg"
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
        showCancelDialog={showCancelDialog}
        onCancelDialogClose={() => {
          setShowCancelDialog(false);
          setSelectedOrder(null);
        }}
        onCancelConfirm={handleCancelConfirm}
        isCancelling={cancelOrderMutation.isPending}
        showAssignDialog={showAssignDialog}
        onAssignDialogClose={() => {
          setShowAssignDialog(false);
          setSelectedOrder(null);
        }}
        onAssignConfirm={handleAssignConfirm}
        isAssigning={assignmentType === 'pickup' ? assignAgentMutation.isPending : assignDeliveryAgentMutation.isPending}
        assignmentType={assignmentType}
        t={t}
        tCommon={tCommon}
      />

      {/* Floating Selection Bar for Batch Print (Selection Mode) */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-lg border-2">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {selectedOrderIds.size} {t("selectedCount")}
              </Badge>
              <div className="flex items-center gap-2">
                {selectedOrderIds.size === orders.length ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    {t("deselectAll")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {t("selectAll")}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handlePrintLabels}
                  disabled={selectedOrderIds.size === 0}
                >
                  <Printer className="h-4 w-4 me-1.5" />
                  {t("printLabels")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Labels Dialog */}
      <PrintLabelsDialog
        open={showPrintDialog}
        onOpenChange={handlePrintDialogClose}
        orders={selectedOrders}
        t={t}
        tCommon={tCommon}
      />

      {/* Import Orders Dialog */}
      <ImportOrdersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  );
}
