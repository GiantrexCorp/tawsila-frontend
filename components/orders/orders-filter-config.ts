import type { FilterConfig } from "@/components/ui/filter-bar";

type TranslationFunction = (key: string) => string;

export const getOrdersFilterConfigs = (t: TranslationFunction): FilterConfig[] => [
  // Order Information
  {
    key: "order_number",
    label: t("orderNumber"),
    type: "text",
    placeholder: t("searchByOrderNumber"),
  },
  {
    key: "tracking_number",
    label: t("trackingNumber"),
    type: "text",
    placeholder: t("searchByTrackingNumber"),
  },
  // Customer Information
  {
    key: "customer_mobile",
    label: t("customerPhone"),
    type: "text",
    placeholder: t("searchByPhone"),
  },
  // Location
  {
    key: "governorate_id",
    label: t("governorate"),
    type: "select",
    options: [], // Will be populated dynamically
    placeholder: t("selectGovernorate"),
  },
  {
    key: "city_id",
    label: t("city"),
    type: "select",
    options: [], // Will be populated dynamically
    placeholder: t("selectCity"),
  },
  // Organization
  {
    key: "vendor_id",
    label: t("vendor"),
    type: "select",
    options: [], // Will be populated dynamically
    placeholder: t("selectVendor"),
  },
  {
    key: "inventory_id",
    label: t("inventory"),
    type: "select",
    options: [], // Will be populated dynamically
    placeholder: t("selectInventory"),
  },
  // Agent
  {
    key: "agent_id",
    label: t("assignedAgent"),
    type: "select",
    options: [], // Will be populated dynamically
    placeholder: t("selectAgent"),
  },
  // Status
  {
    key: "status",
    label: t("status"),
    type: "select",
    options: [
      { label: t("pending"), value: "pending" },
      { label: t("accepted"), value: "accepted" },
      { label: t("pickupAssigned"), value: "pickup_assigned" },
      { label: t("pickedUp"), value: "picked_up" },
      { label: t("inTransit"), value: "in_transit" },
      { label: t("atHub"), value: "at_hub" },
      { label: t("deliveryAssigned"), value: "delivery_assigned" },
      { label: t("outForDelivery"), value: "out_for_delivery" },
      { label: t("delivered"), value: "delivered" },
      { label: t("failedDelivery"), value: "failed_delivery" },
      { label: t("rejected"), value: "rejected" },
    ],
    placeholder: t("selectStatus"),
  },
  {
    key: "payment_status",
    label: t("paymentStatus"),
    type: "select",
    options: [
      { label: t("pending"), value: "pending" },
      { label: t("paid"), value: "paid" },
      { label: t("collected"), value: "collected" },
      { label: t("settled"), value: "settled" },
    ],
    placeholder: t("selectPaymentStatus"),
  },
  // Date Range
  {
    key: "created_at_between",
    label: t("dateRange"),
    type: "daterange",
  },
];

export const DEFAULT_ORDER_FILTERS = ["status", "order_number"];
