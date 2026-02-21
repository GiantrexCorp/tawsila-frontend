"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ImportOrdersUploadStep } from "./import-orders-upload-step";
import { ImportOrdersPreviewStep } from "./import-orders-preview-step";
import { validateAllRows, resolveLocationIds } from "@/lib/parsers/order-import-parser";
import { useImportOrders } from "@/hooks/queries/use-orders";
import { useGovernorates } from "@/hooks/queries/use-vendors";
import { fetchCities } from "@/lib/services/vendors";
import { queryKeys, STALE_TIMES, CACHE_TIMES } from "@/components/providers/query-provider";
import type { ImportedOrderRow, ImportStep } from "@/lib/types/import-orders";
import type { CreateOrderRequest, ImportOrderWarning } from "@/lib/services/orders";

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportOrdersDialog({ open, onOpenChange }: ImportOrdersDialogProps) {
  const t = useTranslations("importOrders");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<ImportStep>("upload");
  const [rows, setRows] = useState<ImportedOrderRow[]>([]);
  const [confirmData, setConfirmData] = useState<{
    validRows: ImportedOrderRow[];
    skippedCount: number;
    reasons: string[];
  } | null>(null);
  const [duplicateConfirmData, setDuplicateConfirmData] = useState<{
    payload: CreateOrderRequest[];
    warnings: ImportOrderWarning[];
  } | null>(null);

  const importMutation = useImportOrders();

  // Fetch governorates + all their cities for location resolution
  const { data: governorates = [] } = useGovernorates();
  const { data: allCities = [] } = useQuery({
    queryKey: [...queryKeys.locations.governorates(), 'all-cities'],
    queryFn: async () => {
      const results = await Promise.all(
        governorates.map((g) => fetchCities(g.id))
      );
      return results.flat();
    },
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
    enabled: governorates.length > 0,
  });

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setConfirmData(null);
    setDuplicateConfirmData(null);
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset]
  );

  const handleFilesParsed = useCallback((parsed: ImportedOrderRow[]) => {
    // Resolve governorate/city strings to database IDs
    if (governorates.length > 0 && allCities.length > 0) {
      resolveLocationIds(parsed, governorates, allCities);
    }
    setRows(parsed);
    setStep("preview");
  }, [governorates, allCities]);

  const handleBack = useCallback(() => {
    if (step === "preview") {
      setStep("upload");
      setRows([]);
    }
  }, [step]);

  const buildPayload = useCallback((validRows: ImportedOrderRow[]): CreateOrderRequest[] => {
    // Group rows by _orderRef so multi-item Shopify orders become a
    // single CreateOrderRequest with multiple items. Rows without an
    // _orderRef are treated as standalone single-item orders.
    const grouped = new Map<string, ImportedOrderRow[]>();
    for (const row of validRows) {
      const key = row._orderRef || row._id;
      const group = grouped.get(key) || [];
      group.push(row);
      grouped.set(key, group);
    }

    return Array.from(grouped.values()).map((group) => {
      const first = group[0];
      return {
        customer: {
          name: first.customerName,
          mobile: first.customerMobile,
          address: first.customerAddress,
          governorate_id: first._governorateId ?? null,
          city_id: first._cityId ?? null,
        },
        items: group.map((row) => ({
          product_name: row.productName,
          quantity: row.quantity,
          unit_price: row.unitPrice,
        })),
        payment_method: first.paymentMethod || "cod",
        vendor_notes: first.vendorNotes || null,
      };
    });
  }, []);

  const getWarningText = useCallback((warning: ImportOrderWarning) => {
    if (warning.type === "payload_duplicate") {
      return t("warningPayloadDuplicate", {
        row: warning.index + 1,
        matchedRow: (warning.matched_index ?? 0) + 1,
      });
    }

    if (warning.type === "existing_order_duplicate") {
      if (warning.matched_order_number) {
        return t("warningExistingDuplicateWithOrder", {
          row: warning.index + 1,
          orderNumber: warning.matched_order_number,
        });
      }

      return t("warningExistingDuplicate", {
        row: warning.index + 1,
      });
    }

    return `${t("warningRowPrefix", { row: warning.index + 1 })}: ${warning.message}`;
  }, [t]);

  const submitOrders = useCallback(async (payload: CreateOrderRequest[], approveDuplicates = false) => {
    setConfirmData(null);
    setDuplicateConfirmData(null);
    setStep("submitting");

    try {
      const result = await importMutation.mutateAsync({ orders: payload, approveDuplicates });
      const warnings = result.warnings ?? [];

      if (result.requires_confirmation) {
        setDuplicateConfirmData({ payload, warnings });
        setStep("preview");
        return;
      }
      toast.success(
        t("importSuccess", {
          success: result.success_count,
          total: payload.length,
        })
      );

      if (warnings.length > 0) {
        const warningSummary = warnings
          .slice(0, 3)
          .map(getWarningText)
          .join("\n");

        toast.warning(t("warningsDetected", { count: warnings.length }), {
          description:
            warnings.length > 3
              ? `${warningSummary}\n${t("moreWarnings", { count: warnings.length - 3 })}`
              : warningSummary,
        });
      }

      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tCommon("tryAgain");
      toast.error(t("importFailed"), { description: message });
      setStep("preview");
    }
  }, [importMutation, handleOpenChange, getWarningText, t, tCommon]);

  const precheckAndSubmit = useCallback(async (validRows: ImportedOrderRow[]) => {
    setConfirmData(null);
    setDuplicateConfirmData(null);
    setStep("submitting");

    const payload = buildPayload(validRows);

    try {
      const precheckResult = await importMutation.mutateAsync({
        orders: payload,
        checkOnly: true,
      });

      const warnings = precheckResult.warnings ?? [];
      if (warnings.length > 0) {
        setDuplicateConfirmData({ payload, warnings });
        setStep("preview");
        return;
      }

      await submitOrders(payload, false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tCommon("tryAgain");
      toast.error(t("importFailed"), { description: message });
      setStep("preview");
    }
  }, [buildPayload, importMutation, submitOrders, t, tCommon]);

  const handleSubmit = useCallback(() => {
    // Validate all rows and separate valid from invalid.
    validateAllRows(rows);
    const validRows = rows.filter((r) => Object.keys(r._errors).length === 0);
    const invalidRows = rows.filter((r) => Object.keys(r._errors).length > 0);

    if (rows.length === 0) {
      toast.error(t("noOrdersToImport"));
      return;
    }

    if (validRows.length === 0) {
      toast.error(t("allOrdersInvalid", { count: invalidRows.length }));
      return;
    }

    // If there are invalid rows, show confirmation dialog before proceeding.
    if (invalidRows.length > 0) {
      const reasons = new Set<string>();
      for (const row of invalidRows) {
        for (const errKey of Object.values(row._errors)) {
          if (errKey) reasons.add(t(`errors.${errKey}`));
        }
      }
      setConfirmData({
        validRows,
        skippedCount: invalidRows.length,
        reasons: [...reasons],
      });
      return;
    }

    // All rows valid - run duplicate pre-check first.
    void precheckAndSubmit(validRows);
  }, [precheckAndSubmit, rows, t]);

  const stepNumber = step === "upload" ? 1 : step === "preview" ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-3 pt-2">
            {[
              { num: 1, label: t("stepUpload") },
              { num: 2, label: t("stepPreview") },
              { num: 3, label: t("stepSubmit") },
            ].map(({ num, label }, idx) => (
              <div key={num} className="flex items-center gap-2">
                {idx > 0 && (
                  <div
                    className={`h-px w-8 ${
                      stepNumber > idx ? "bg-primary" : "bg-muted-foreground/25"
                    }`}
                  />
                )}
                <div
                  className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
                    stepNumber >= num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {num}
                </div>
                <span
                  className={`text-sm hidden sm:inline ${
                    stepNumber >= num
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {step === "upload" && (
            <ImportOrdersUploadStep onFilesParsed={handleFilesParsed} />
          )}
          {(step === "preview" || step === "submitting") && (
            <ImportOrdersPreviewStep rows={rows} onRowsChange={setRows} />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                {tCommon("back")}
              </Button>
              <Button onClick={handleSubmit} disabled={rows.length === 0}>
                {t("submitOrders")}
              </Button>
            </>
          )}
          {step === "submitting" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin me-2" />
              {t("submitting")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Confirmation dialog for skipped orders */}
      <AlertDialog open={!!confirmData} onOpenChange={() => setConfirmData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmSkipTitle")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t("confirmSkipMessage", {
                    skip: confirmData?.skippedCount ?? 0,
                    valid: confirmData?.validRows.length ?? 0,
                  })}
                </p>
                <ul className="list-disc ps-5 space-y-1 text-sm">
                  {confirmData?.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmData) {
                  void precheckAndSubmit(confirmData.validRows);
                }
              }}
            >
              {t("confirmSkipAction", { count: confirmData?.validRows.length ?? 0 })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for duplicate warnings */}
      <AlertDialog
        open={!!duplicateConfirmData}
        onOpenChange={() => setDuplicateConfirmData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDuplicateTitle")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t("confirmDuplicateMessage", {
                    count: duplicateConfirmData?.warnings.length ?? 0,
                  })}
                </p>
                <ul className="list-disc ps-5 space-y-1 text-sm">
                  {duplicateConfirmData?.warnings.slice(0, 5).map((warning, idx) => (
                    <li key={`${warning.type}-${warning.index}-${idx}`}>
                      {getWarningText(warning)}
                    </li>
                  ))}
                </ul>
                {(duplicateConfirmData?.warnings.length ?? 0) > 5 && (
                  <p className="text-sm text-muted-foreground">
                    {t("moreWarnings", {
                      count: (duplicateConfirmData?.warnings.length ?? 0) - 5,
                    })}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelImport")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (duplicateConfirmData) {
                  void submitOrders(duplicateConfirmData.payload, true);
                }
              }}
            >
              {t("continueImport")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
