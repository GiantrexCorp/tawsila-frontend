"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "table" | "cards";

interface OrdersViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function OrdersViewToggle({
  view,
  onViewChange,
  className,
}: OrdersViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 border rounded-lg p-1", className)}>
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="h-8 w-8 p-0"
        title="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 w-8 p-0"
        title="Table view"
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
