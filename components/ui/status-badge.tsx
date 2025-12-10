"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Status badge configuration for different status types
 */
const statusConfig: Record<string, { className: string }> = {
  // Order statuses
  pending: {
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
  },
  created: {
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
  },
  confirmed: {
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
  },
  accepted: {
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
  },
  picked_up: {
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30"
  },
  in_transit: {
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
  },
  delivered: {
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
  },
  completed: {
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
  },
  rejected: {
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
  },
  cancelled: {
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"
  },
  failed: {
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
  },

  // User/Entity statuses
  active: {
    className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
  },
  inactive: {
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
  },

  // Payment statuses
  paid: {
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
  },
  unpaid: {
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
  },
  partial: {
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
  },
};

const defaultConfig = {
  className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"
};

export interface StatusBadgeProps {
  /** The status key (e.g., 'pending', 'active', 'delivered') */
  status: string;
  /** Optional display label. If not provided, will use statusLabel or formatted status */
  label?: string;
  /** Backend-provided status label (for i18n support) */
  statusLabel?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable status badge component with consistent styling
 *
 * @example
 * <StatusBadge status="pending" label="Pending" />
 * <StatusBadge status={order.status} statusLabel={order.status_label} />
 */
export function StatusBadge({
  status,
  label,
  statusLabel,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || defaultConfig;

  // Determine display text: explicit label > statusLabel from backend > formatted status
  const displayText = label || statusLabel || formatStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {displayText}
    </Badge>
  );
}

/**
 * Formats a status string for display (e.g., 'in_transit' -> 'In Transit')
 */
function formatStatus(status: string): string {
  return status
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Order status badge with order-specific defaults
 */
export function OrderStatusBadge({
  status,
  statusLabel,
  className,
}: Omit<StatusBadgeProps, 'label'>) {
  return (
    <StatusBadge
      status={status}
      statusLabel={statusLabel}
      className={className}
    />
  );
}

/**
 * User status badge (active/inactive)
 */
export function UserStatusBadge({
  status,
  label,
  className,
}: Omit<StatusBadgeProps, 'statusLabel'>) {
  return (
    <StatusBadge
      status={status}
      label={label}
      className={className}
    />
  );
}

/**
 * Payment status badge
 */
export function PaymentStatusBadge({
  status,
  statusLabel,
  className,
}: Omit<StatusBadgeProps, 'label'>) {
  return (
    <StatusBadge
      status={status}
      statusLabel={statusLabel}
      className={className}
    />
  );
}
