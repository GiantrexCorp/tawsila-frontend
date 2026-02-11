"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImportOrdersUploadStep } from "./import-orders-upload-step";
import { ImportOrdersPreviewStep } from "./import-orders-preview-step";
import { validateAllRows } from "@/lib/parsers/order-import-parser";
import { useImportOrders } from "@/hooks/queries/use-orders";
import type { ImportedOrderRow, ImportStep } from "@/lib/types/import-orders";
import type { CreateOrderRequest } from "@/lib/services/orders";

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportOrdersDialog({ open, onOpenChange }: ImportOrdersDialogProps) {
  const t = useTranslations("importOrders");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState<ImportStep>("upload");
  const [rows, setRows] = useState<ImportedOrderRow[]>([]);

  const importMutation = useImportOrders();

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset]
  );

  const handleFilesParsed = useCallback((parsed: ImportedOrderRow[]) => {
    setRows(parsed);
    setStep("preview");
  }, []);

  const handleBack = useCallback(() => {
    if (step === "preview") {
      setStep("upload");
      setRows([]);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    const errorCount = validateAllRows(rows);
    if (errorCount > 0) {
      toast.error(t("fixErrorsBeforeSubmit", { count: errorCount }));
      return;
    }

    if (rows.length === 0) {
      toast.error(t("noOrdersToImport"));
      return;
    }

    setStep("submitting");

    const payload: CreateOrderRequest[] = rows.map((row) => ({
      customer: {
        name: row.customerName,
        mobile: row.customerMobile,
        address: row.customerAddress,
      },
      items: [
        {
          product_name: row.productName,
          quantity: row.quantity,
          unit_price: row.unitPrice,
        },
      ],
      payment_method: row.paymentMethod || "cash",
      vendor_notes: row.vendorNotes || null,
    }));

    try {
      const result = await importMutation.mutateAsync(payload);
      toast.success(
        t("importSuccess", {
          success: result.success_count,
          total: payload.length,
        })
      );
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tCommon("tryAgain");
      toast.error(t("importFailed"), { description: message });
      setStep("preview");
    }
  }, [rows, importMutation, handleOpenChange, t, tCommon]);

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
    </Dialog>
  );
}
