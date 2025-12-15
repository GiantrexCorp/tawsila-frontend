"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MapPin, Phone } from "lucide-react";
import type { Inventory } from "@/lib/services/inventories";

interface InventoryTableProps {
  inventories: Inventory[];
  canUpdateInventory: boolean;
}

export function InventoryTable({ inventories, canUpdateInventory }: InventoryTableProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const getDisplayName = (inventory: Inventory) => {
    return locale === "ar" && inventory.name_ar
      ? inventory.name_ar
      : inventory.name_en || inventory.name || t("unnamedInventory");
  };

  return (
    <div className="rounded-lg border bg-card w-full overflow-hidden">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">{t("name")}</TableHead>
            <TableHead className="min-w-[120px]">{t("code")}</TableHead>
            <TableHead className="min-w-[150px]">{t("location")}</TableHead>
            <TableHead className="min-w-[120px]">{t("phone")}</TableHead>
            <TableHead className="min-w-[100px]">{t("status")}</TableHead>
            <TableHead className="min-w-[120px]">{tCommon("createdOn")}</TableHead>
            <TableHead className="w-[100px]">{t("viewDetails")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventories.map((inventory) => (
            <TableRow
              key={inventory.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/dashboard/inventory/${inventory.id}`)}
            >
              <TableCell className="font-medium">
                {getDisplayName(inventory)}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-muted-foreground">
                  {inventory.code || "-"}
                </span>
              </TableCell>
              <TableCell>
                {inventory.city ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {locale === "ar" ? inventory.city.name_ar : inventory.city.name_en}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {inventory.phone ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span dir="ltr">{inventory.phone}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={inventory.status === "active" || inventory.is_active ? "default" : "secondary"}
                  className={
                    inventory.status === "active" || inventory.is_active
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                      : ""
                  }
                >
                  {inventory.status === "active" || inventory.is_active ? t("active") : t("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {inventory.created_at
                  ? new Date(inventory.created_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/inventory/${inventory.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canUpdateInventory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/inventory/${inventory.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
