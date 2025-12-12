import type { FilterConfig } from "@/components/ui/filter-bar";
import type { Governorate, City } from "@/lib/services/vendors";

type TranslationFunction = (key: string) => string;

export const getInventoryFilterConfigs = (
  t: TranslationFunction,
  governorates: Governorate[],
  cities: City[],
  locale: string
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
];

export const DEFAULT_INVENTORY_FILTERS = ["name", "code"];

