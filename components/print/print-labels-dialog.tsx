"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, FileText, Scissors } from "lucide-react";
import { ShippingLabel } from "./shipping-label";
import type { Order } from "@/lib/services/orders";

// Cut line component between labels
function CutLine() {
  return (
    <div className="cut-line">
      <Scissors className="cut-line-scissors cut-line-scissors-start" />
      <div className="cut-line-dashed" />
      <Scissors className="cut-line-scissors cut-line-scissors-end" />
    </div>
  );
}

const LABELS_PER_PAGE = 2;

export interface PrintLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function PrintLabelsDialog({
  open,
  onOpenChange,
  orders,
  t,
  tCommon,
}: PrintLabelsDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Group orders into pages (2 per page)
  const pages = useMemo(() => {
    const result: Order[][] = [];
    for (let i = 0; i < orders.length; i += LABELS_PER_PAGE) {
      result.push(orders.slice(i, i + LABELS_PER_PAGE));
    }
    return result;
  }, [orders]);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      onOpenChange(false);
    }, 200);
  }, [onOpenChange]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const labelCount = orders.length;
  const pageCount = Math.ceil(labelCount / LABELS_PER_PAGE);

  // Print content to be rendered in portal
  const printContent = mounted && open && orders.length > 0 ? createPortal(
    <div className="print-container">
      {pages.map((pageOrders, pageIndex) => (
        <div key={pageIndex} className="print-page">
          {pageOrders.map((order, orderIndex) => (
            <div key={order.id} className="label-wrapper">
              <ShippingLabel
                order={order}
                t={t}
                tCommon={tCommon}
              />
              {/* Show cut line after first label if there are 2 labels on this page */}
              {orderIndex === 0 && pageOrders.length === 2 && <CutLine />}
            </div>
          ))}
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              {t("printLabels")}
            </DialogTitle>
            <DialogDescription>
              {t("printLabelsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-lg">
                  {labelCount} {labelCount === 1 ? t("label") : t("labels")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pageCount} {pageCount === 1 ? t("page") : t("pages")} ({t("labelsPerPage")})
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>{t("printLabelsHint")}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPrinting}
            >
              <X className="h-4 w-4 me-2" />
              {tCommon("cancel")}
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting || labelCount === 0}>
              <Printer className="h-4 w-4 me-2" />
              {isPrinting ? t("printing") : t("print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printContent}
    </>
  );
}
