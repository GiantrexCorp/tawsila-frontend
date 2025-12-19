import type { FilterConfig } from "@/components/ui/filter-bar";

type TranslationFunction = (key: string) => string;

export const getInventoryFilterConfigs = (
  t: TranslationFunction
): FilterConfig[] => [
  {
    key: "name",
    label: t("name"),
    type: "text",
    placeholder: t("searchInventories"),
  },
  {
    key: "code",
    label: t("inventoryCode"),
    type: "text",
    placeholder: t("inventoryCode"),
  },
  {
    key: "status",
    label: t("status"),
    type: "select",
    options: [
      { value: "active", label: t("active") },
      { value: "inactive", label: t("inactive") },
    ],
    placeholder: t("status"),
  },
];

export const DEFAULT_INVENTORY_FILTERS = ["name", "code"];

