"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "table" | "cards";

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
  cardLabel?: string;
  tableLabel?: string;
}

export function ViewToggle({
  view,
  onViewChange,
  className,
  cardLabel = "Card view",
  tableLabel = "Table view",
}: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 border rounded-lg p-1", className)}>
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="h-8 w-8 p-0"
        title={cardLabel}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 w-8 p-0"
        title={tableLabel}
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
