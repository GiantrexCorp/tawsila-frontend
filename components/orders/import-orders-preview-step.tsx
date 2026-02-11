"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportedOrderRow, ExpectedColumn } from "@/lib/types/import-orders";

interface ImportOrdersPreviewStepProps {
  rows: ImportedOrderRow[];
  onRowsChange: (rows: ImportedOrderRow[]) => void;
}

export function ImportOrdersPreviewStep({
  rows,
  onRowsChange,
}: ImportOrdersPreviewStepProps) {
  const t = useTranslations("importOrders");

  const hasOrderRefs = useMemo(
    () => rows.some((r) => r._orderRef),
    [rows]
  );

  const updateField = useCallback(
    (id: string, field: string, value: string | number) => {
      onRowsChange(
        rows.map((r) => (r._id === id ? { ...r, [field]: value, _errors: { ...r._errors, [field]: undefined } } : r))
      );
    },
    [rows, onRowsChange]
  );

  const deleteRow = useCallback(
    (id: string) => {
      onRowsChange(rows.filter((r) => r._id !== id));
    },
    [rows, onRowsChange]
  );

  const errorCount = rows.filter((r) => Object.values(r._errors).some(Boolean)).length;

  // Count unique orders (grouped by _orderRef, or each row if no ref)
  const orderCount = useMemo(() => {
    if (!hasOrderRefs) return rows.length;
    const refs = new Set(rows.map((r) => r._orderRef || r._id));
    return refs.size;
  }, [rows, hasOrderRefs]);

  const cellClass = (row: ImportedOrderRow, field: ExpectedColumn) =>
    row._errors[field] ? "border-destructive border-2" : "";

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className={hasOrderRefs ? "min-w-[1200px]" : "min-w-[1100px]"}>
          <Table>
            <TableHeader>
              <TableRow>
                {hasOrderRefs && (
                  <TableHead className="min-w-[80px]">{t("orderRef")}</TableHead>
                )}
                <TableHead className="min-w-[140px]">{t("customerName")}</TableHead>
                <TableHead className="min-w-[130px]">{t("mobile")}</TableHead>
                <TableHead className="min-w-[160px]">{t("address")}</TableHead>
                <TableHead className="min-w-[110px]">{t("governorate")}</TableHead>
                <TableHead className="min-w-[110px]">{t("city")}</TableHead>
                <TableHead className="min-w-[140px]">{t("product")}</TableHead>
                <TableHead className="min-w-[70px]">{t("qty")}</TableHead>
                <TableHead className="min-w-[90px]">{t("price")}</TableHead>
                <TableHead className="min-w-[110px]">{t("payment")}</TableHead>
                <TableHead className="min-w-[130px]">{t("notes")}</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  {hasOrderRefs && (
                    <TableCell className="p-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {row._orderRef || "—"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="p-1">
                    <Input
                      value={row.customerName}
                      onChange={(e) => updateField(row._id, "customerName", e.target.value)}
                      className={`h-8 text-sm ${cellClass(row, "customerName")}`}
                    />
                    {row._errors.customerName && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.customerName}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.customerMobile}
                      onChange={(e) => updateField(row._id, "customerMobile", e.target.value)}
                      className={`h-8 text-sm ${cellClass(row, "customerMobile")}`}
                    />
                    {row._errors.customerMobile && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.customerMobile}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.customerAddress}
                      onChange={(e) => updateField(row._id, "customerAddress", e.target.value)}
                      className={`h-8 text-sm ${cellClass(row, "customerAddress")}`}
                    />
                    {row._errors.customerAddress && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.customerAddress}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.governorate}
                      onChange={(e) => updateField(row._id, "governorate", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.city}
                      onChange={(e) => updateField(row._id, "city", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.productName}
                      onChange={(e) => updateField(row._id, "productName", e.target.value)}
                      className={`h-8 text-sm ${cellClass(row, "productName")}`}
                    />
                    {row._errors.productName && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.productName}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateField(row._id, "quantity", parseInt(e.target.value, 10) || 1)}
                      className={`h-8 text-sm w-[70px] ${cellClass(row, "quantity")}`}
                    />
                    {row._errors.quantity && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.quantity}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) => updateField(row._id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className={`h-8 text-sm w-[90px] ${cellClass(row, "unitPrice")}`}
                    />
                    {row._errors.unitPrice && (
                      <span className="text-[10px] text-destructive">{t(`errors.${row._errors.unitPrice}`)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    <Select
                      value={row.paymentMethod || "cash"}
                      onValueChange={(v) => updateField(row._id, "paymentMethod", v)}
                    >
                      <SelectTrigger className="h-8 text-sm w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t("cash")}</SelectItem>
                        <SelectItem value="card">{t("card")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.vendorNotes}
                      onChange={(e) => updateField(row._id, "vendorNotes", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRow(row._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>
          {hasOrderRefs
            ? t("itemsAndOrders", { items: rows.length, orders: orderCount })
            : `${rows.length} ${t("ordersCount")}`}
        </span>
        {errorCount > 0 && (
          <span className="text-destructive font-medium">
            {errorCount} {t("errorsCount")}
          </span>
        )}
      </div>
    </div>
  );
}
