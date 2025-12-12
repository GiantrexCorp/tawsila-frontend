"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "table" | "cards";

interface OrdersViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
  t?: (key: string) => string;
}

export function OrdersViewToggle({
  view,
  onViewChange,
  className,
  t,
}: OrdersViewToggleProps) {
  const cardViewTitle = t ? t("cardView") : "Card view";
  const tableViewTitle = t ? t("tableView") : "Table view";

  return (
    <div className={cn("flex items-center gap-1 border rounded-lg p-1", className)}>
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="h-8 w-8 p-0"
        title={cardViewTitle}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 w-8 p-0"
        title={tableViewTitle}
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
