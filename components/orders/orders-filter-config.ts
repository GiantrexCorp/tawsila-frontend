import type { FilterConfig } from "@/components/ui/filter-bar";

type TranslationFunction = (key: string) => string;

export const getOrdersFilterConfigs = (t: TranslationFunction): FilterConfig[] => [
  {
    key: "order_number",
    label: t("orderNumber"),
    type: "text",
    placeholder: t("searchByOrderNumber"),
  },
  {
    key: "customer_name",
    label: t("customerName"),
    type: "text",
    placeholder: t("searchByCustomerName"),
  },
  {
    key: "customer_mobile",
    label: t("customerMobile"),
    type: "text",
    placeholder: t("searchByMobile"),
  },
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
      { label: t("paid"), value: "paid" },
      { label: t("unpaid"), value: "unpaid" },
    ],
    placeholder: t("selectPaymentStatus"),
  },
  {
    key: "created_at_between",
    label: t("createdAt"),
    type: "daterange",
  },
];

export const DEFAULT_ORDER_FILTERS = ["status", "order_number"];
