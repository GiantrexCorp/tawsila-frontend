"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseImportFile, autoMapColumns, mapRowsToOrders, generateTemplate } from "@/lib/parsers/order-import-parser";
import type { ImportedOrderRow } from "@/lib/types/import-orders";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImportOrdersUploadStepProps {
  onFilesParsed: (rows: ImportedOrderRow[]) => void;
}

export function ImportOrdersUploadStep({ onFilesParsed }: ImportOrdersUploadStepProps) {
  const t = useTranslations("importOrders");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_FILE_SIZE) {
        setError(t("fileTooLarge"));
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        setError(t("unsupportedFileType"));
        return;
      }

      setIsParsing(true);
      try {
        const { headers, rows } = await parseImportFile(file);
        if (rows.length === 0) {
          setError(t("emptyFile"));
          return;
        }
        const mapping = autoMapColumns(headers);
        const orders = mapRowsToOrders(rows, mapping, headers);
        onFilesParsed(orders);
      } catch {
        setError(t("parseError"));
      } finally {
        setIsParsing(false);
      }
    },
    [onFilesParsed, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be picked again
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {isParsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("parsing")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("dragAndDrop")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("orClickToBrowse")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{t("supportedFormats")}</span>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Download template */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            generateTemplate("csv");
          }}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t("downloadTemplate")}
        </Button>
      </div>
    </div>
  );
}
